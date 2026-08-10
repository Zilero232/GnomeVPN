# Развёртывание GnomeVPN

## Что где работает

| Компонент         | Где            | Как обновляется              |
| ----------------- | -------------- | ---------------------------- |
| Лендинг + кабинет | VPS, Caddy     | CI: `deploy.yml`             |
| API               | VPS, Docker    | CI: `deploy.yml`             |
| База              | VPS, Docker    | там же                       |
| Десктоп + Android | у пользователя | CI: `release.yml` по тегу v* |
| VPN-узлы          | отдельные VPS  | `bun run provision:nodes`    |

Всё, кроме провижининга узлов, собирается в GitHub Actions. Образы кладутся
в ghcr.io; **VPS ничего не собирает** — только забирает готовые образы.

---

## Релиз

Тег запускает `release.yml`:

```bash
npm version patch        # или отредактируй version в package.json
git push --follow-tags
```

Дальше CI сам: три раннера (Windows, macOS, Linux) собирают десктоп через
`tauri-action`, отдельная джоба — Android, последняя публикует релиз.
Кросс-компиляция тут не годится: Tauri её не поддерживает, а macOS вообще
нельзя собрать не на Mac — отсюда матрица раннеров.

`tauri-action` сам сливает `latest.json` по всем платформам, поэтому автообновление
получает одну запись на каждую ОС.

### Разовая подготовка секретов

Settings → Secrets and variables → Actions:

| Секрет                                    | Что это                                              |
| ----------------------------------------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`                     | адрес API, вшивается в сборку                        |
| `TAURI_SIGNING_PRIVATE_KEY`               | содержимое `~/.tauri/gnomevpn.key`                   |
| `ANDROID_KEY_ALIAS`                       | алиас ключа подписи APK                              |
| `ANDROID_KEY_PASSWORD`                    | пароль keystore и ключа                              |
| `ANDROID_KEY_BASE64`                      | сам keystore в base64                                |
| `DEPLOY_SSH_HOST` / `_USER` / `_PASSWORD` | control-VPS                                          |
| `DEPLOY_PATH`                             | каталог с docker-compose.yml, обычно `/opt/gnomevpn` |

Ключ подписи обновлений создаётся один раз:

```bash
bun run --filter @gnomevpn/tauri signer:generate   # пишет ~/.tauri/gnomevpn.key
```

Android-keystore — тоже один раз, локально:

```bash
keytool -genkeypair -v -keystore gnomevpn.keystore -alias gnomevpn \
  -keyalg RSA -keysize 2048 -validity 10000
base64 -i gnomevpn.keystore | pbcopy                # → ANDROID_KEY_BASE64
```

**Сохрани keystore вне репозитория.** Потеряешь — обновить уже установленные APK
будет нечем, а новый ключ Play Store не примет.

## Деплой веб + API

`deploy.yml` срабатывает на push в master (или вручную). Собирает образы web и
server, пушит в ghcr.io, заходит по SSH на VPS, копирует `docker-compose.yml`,
делает `pull && up -d` и применяет миграции. VPS остаётся тем же — только
забирает образы.

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

Релиз и деплой идут через Actions, поэтому почти всё живёт в секретах репозитория.
Локально остаётся только провижининг:

- **SSH к узлам** — `PROVISION_SSH_*` в корневом `.env` (см. раздел 3).
- **Ключ подписи десктопа** — `~/.tauri/gnomevpn.key` (см. ниже).
- **Android-keystore** — создаётся `keytool` один раз, живёт в секретах репозитория.

### Ключ подписи обновлений

Нужен, чтобы приложение принимало обновления только от нас. Генерируется один раз:

```bash
bun --filter @gnomevpn/tauri signer:generate
```

Создаст два файла в `~/.tauri/` — вне репозитория, так ключ физически не может попасть в git.

Дальше:

1. `~/.tauri/gnomevpn.key.pub` → поле `plugins.updater.pubkey` в
   `tauri.windows.conf.json`, `tauri.macos.conf.json` и `tauri.linux.conf.json`
2. Там же `"active": false` → `true`

CI берёт приватный ключ из секрета `TAURI_SIGNING_PRIVATE_KEY`. Если ключ
зашифрован — заведи второй секрет `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` и
подставь его в `release.yml`.

Подписать файл вручную (обычно не нужно — CI делает это сам):

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

История миграций лежит в `apps/server/prisma/migrations`. `deploy.yml`
применяет их сам: при наличии файлов миграций он делает `migrate resolve`
(baseline для базы, собранной ранее через `db push`) и затем `migrate deploy`.

Новую миграцию создать так:

```bash
cd apps/server
bunx prisma migrate dev --name <название>
```

Следующий запуск `deploy.yml` её накатит.

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
