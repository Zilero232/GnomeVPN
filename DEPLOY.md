# Развёртывание GnomeVPN

## Что где работает

| Компонент         | Где            | Как обновляется           |
| ----------------- | -------------- | ------------------------- |
| Лендинг + кабинет | VPS, Caddy     | `bun run deploy:web`      |
| API               | VPS, Docker    | `bun run deploy:web`      |
| База              | VPS, Docker    | там же                    |
| Десктоп + Android | у пользователя | `bun run release`         |
| VPN-узлы          | отдельные VPS  | `bun run provision:nodes` |

CI нет — всё собирается и выкатывается локально с рабочей машины. Образы кладутся
в ghcr.io; **VPS ничего не собирает** — только забирает готовые образы.

---

## Локальный релиз и деплой

Всё делается локальными скриптами с рабочей машины. Секреты берутся из единого
корневого `.env` и сгенерированного `.env.release` (оба вне git), ничего вводить
руками не нужно.

### Разовая подготовка

```bash
bun run setup:release
```

Ставит `gh` через winget, генерирует Android-keystore
(`apps/tauri/gnomevpn.keystore`) и пишет `ANDROID_KEY_*` в `.env.release`.
Keystore и `.env.release` в git не попадают — **сохрани их копию отдельно**,
иначе следующий релиз подпишется другим ключом и обновление у пользователей не
сойдётся. Если ключ подписи десктопа зашифрован, впиши его пароль в
`TAURI_SIGNING_PRIVATE_KEY_PASSWORD` в `.env.release`.

`gh` после установки требует один вход: `gh auth login`.

### Релиз десктопа и Android

```bash
bun run release            # десктоп + Android в один релиз vX.Y.Z
bun run release --desktop  # только Windows
bun run release --android  # только Android
```

Создаёт (или переиспользует) черновик `vX.Y.Z` по версии из `package.json`,
собирает и подписывает, заливает артефакты и публикует релиз. Повторный запуск
на той же версии дозаливает в существующий черновик.

### Деплой веб + API

```bash
bun run deploy:web
```

Собирает образы web и server, пушит в ghcr.io, заходит по SSH на VPS
(`PROVISION_SSH_*` из `.env`), копирует `docker-compose.yml`, делает
`pull && up -d` и применяет миграции. VPS остаётся тем же — только забирает
образы.

---

## 1. Домен

Зарегистрировать `gnomevpn.ru` и создать A-записи на IP сервера:

```
gnomevpn.ru        A    <IP>
www.gnomevpn.ru    A    <IP>
api.gnomevpn.ru    A    <IP>
```

Без этого Caddy не выпустит сертификат.

---

## 2. Подготовка VPS

```bash
curl -fsSL https://get.docker.com | sh

ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

mkdir -p /opt/gnomevpn
```

Логин в реестр образов (токен с правом `read:packages`):

```bash
echo "<GITHUB_TOKEN>" | docker login ghcr.io -u <username> --password-stdin
```

---

## 3. Файл .env на сервере

Создать `/opt/gnomevpn/.env`. Он не в git — только на VPS.

```env
NODE_ENV=production
PORT=4000

# Postgres читает эти три переменные напрямую при создании базы
POSTGRES_USER=gnomevpn
POSTGRES_PASSWORD=<длинный случайный пароль>
POSTGRES_DB=gnomevpn

# postgres — имя сервиса в docker-compose, не localhost
DATABASE_URL=postgresql://gnomevpn:<пароль>@postgres:5432/gnomevpn
DIRECT_URL=postgresql://gnomevpn:<пароль>@postgres:5432/gnomevpn

BETTER_AUTH_SECRET=<32+ случайных символа>
API_URL=https://api.gnomevpn.ru

CORS_ORIGINS=https://gnomevpn.ru,tauri://localhost,http://tauri.localhost

GITHUB_TOKEN=<PAT с правом Contents: Read — без него не работают обновления десктопа>

YOOKASSA_SHOP_ID=<из личного кабинета ЮKassa>
YOOKASSA_SECRET_KEY=<оттуда же>
YOOKASSA_RETURN_URL=https://gnomevpn.ru/account
# Автосписания ЮKassa подключает вручную по заявке в поддержку.
YOOKASSA_RECURRING=false

# Почта: подтверждение адреса, смена почты, сброс пароля.
# Адрес в EMAIL_FROM обязан совпадать с SMTP_USER, иначе провайдер отклонит
# письмо с ошибкой "Sender address rejected: not owned by auth user".
SMTP_HOST=smtp.timeweb.ru
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@gnomevpn.ru
SMTP_PASSWORD=<пароль почтового ящика>
EMAIL_FROM=GnomeVPN <noreply@gnomevpn.ru>

# Куда ведут ссылки из писем.
CLIENT_URL=https://gnomevpn.ru

```

Ключи узлов сюда не пишутся. `bun provision` складывает их в отдельный файл
`.env.nodes` рядом с `docker-compose.yml` — по паре на узел: `XRAY_KEY_<код
страны>` (имя из колонки `node.api_token_env_var`) и `XRAY_PANEL_<код страны>`.
Контейнер подхватывает оба файла, так что `.env` остаётся рукописным.
Проверить, какие переменные нужны: `SELECT country, api_token_env_var FROM node;`

Цены тарифов в `.env` не задаются — они живут в `PLANS` (`packages/schemas`),
откуда их читает и сервер при списании, и лендинг при отрисовке.

**Если в пароле есть `$`, его нужно удвоить: `$$`.** Docker Compose
подставляет переменные внутри `.env`, и одиночный `$` съедается.

Письма не заработают, пока у домена нет записей **SPF, DKIM и DMARC** —
Gmail и mail.ru отправляют такие сообщения в спам или отклоняют совсем.
Значения выдаёт почтовый провайдер. Пока SMTP не заполнен, регистрация и
вход работают, а письма молча не отправляются (в лог пишется ошибка).

Пароли генерируются так:

```bash
openssl rand -base64 32
```

**`CORS_ORIGINS` должен включать `tauri://localhost`** — иначе десктопное приложение не сможет обращаться к API.

---

## 4. Ключи для релиза

CI нет, поэтому секретов в GitHub тоже нет. Всё живёт локально:

- **SSH к VPS** — `PROVISION_SSH_*` в корневом `.env` (см. раздел 3).
- **Ключ подписи десктопа** — `~/.tauri/gnomevpn.key` (см. ниже).
- **Android-keystore** — создаётся `bun run setup:release`, пишется в `.env.release`.

### Ключ подписи обновлений

Нужен, чтобы приложение принимало обновления только от нас. Генерируется один раз:

```bash
bun --filter @gnomevpn/tauri signer:generate
```

Создаст два файла в `~/.tauri/` — вне репозитория, так ключ физически не может попасть в git.

Дальше:

1. `~/.tauri/gnomevpn.key.pub` → `apps/tauri/tauri.windows.conf.json`, поле `plugins.updater.pubkey`
2. Там же `"active": false` → `true`

Релиз (`bun run release`) читает приватный ключ из `~/.tauri/gnomevpn.key` сам.
Если ключ зашифрован — впиши его пароль в `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` в
`.env.release`.

Подписать файл вручную (обычно не нужно — `bun run release` делает это сам):

```bash
bun --filter @gnomevpn/tauri signer:sign -- <путь-к-файлу>
```

**Приватный ключ восстановить нельзя.** Потеряете — придётся выпускать новую версию с новым ключом, а у пользователей старой автообновление перестанет работать: они увидят обновление, но подпись не сойдётся. Сохраните копию отдельно от репозитория.

---

## 5. Первый запуск

```bash
cd /opt/gnomevpn
docker compose pull
docker compose up -d
docker compose logs -f
```

Проверка:

```bash
curl https://api.gnomevpn.ru/health   # {"status":"ok"}
curl -I https://gnomevpn.ru           # 200
```

---

## 6. Миграции базы

История миграций лежит в `apps/server/prisma/migrations`. `bun run deploy:web`
применяет их сам: при наличии файлов миграций он делает `migrate resolve`
(baseline для базы, собранной ранее через `db push`) и затем `migrate deploy`.

Новую миграцию создать так:

```bash
cd apps/server
bunx prisma migrate dev --name <название>
```

Следующий `bun run deploy:web` её накатит.

---

## Полезные команды

```bash
docker compose logs -f server     # логи API
docker compose restart server     # перезапуск
docker compose pull && docker compose up -d   # обновление вручную

# бэкап базы
docker compose exec postgres pg_dump -U gnomevpn gnomevpn > backup.sql
```

Порт 5432 наружу не открыт. Для подключения клиентом использовать SSH-туннель:

```bash
ssh -L 5432:localhost:5432 user@<IP>
```

---

## Локальная проверка образов

```bash
docker build -f apps/server/Dockerfile -t gnomevpn-server .
docker build -f apps/client/Dockerfile --build-arg NEXT_PUBLIC_API_URL=https://api.gnomevpn.ru -t gnomevpn-web .
```
