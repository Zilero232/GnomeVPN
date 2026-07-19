# Развёртывание GnomeVPN

## Что где работает

| Компонент | Где | Как обновляется |
|---|---|---|
| Лендинг + кабинет | VPS, Caddy | push в master → `deploy-web.yml` |
| API | VPS, Docker | push в master → `deploy-web.yml` |
| База | VPS, Docker | там же |
| Десктоп | у пользователя | версия в `package.json` → `release-app.yml` |
| VPN-узлы | отдельные VPS | `bun run provision:nodes` |

CI собирает образы и кладёт в ghcr.io. **VPS ничего не собирает** — только забирает готовые образы.

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
BETTER_AUTH_URL=https://api.gnomevpn.ru

CORS_ORIGINS=https://gnomevpn.ru,tauri://localhost,http://tauri.localhost

YOOKASSA_SHOP_ID=<из личного кабинета ЮKassa>
YOOKASSA_SECRET_KEY=<оттуда же>
YOOKASSA_RETURN_URL=https://gnomevpn.ru/account
SUBSCRIPTION_PRICE_RUB=100

# Имя переменной берётся из колонки node.wg_easy_api_key_ref — по одной на узел.
# Проверить, какие нужны: SELECT country, wg_easy_api_key_ref FROM node;
WG_KEY_DE=<пароль панели wg-easy на узле>
```

Пароли генерируются так:

```bash
openssl rand -base64 32
```

**`CORS_ORIGINS` должен включать `tauri://localhost`** — иначе десктопное приложение не сможет обращаться к API.

---

## 4. Секреты GitHub

Settings → Secrets and variables → Actions:

| Секрет | Значение |
|---|---|
| `SSH_HOST` | IP сервера |
| `SSH_USER` | `root` или пользователь для деплоя |
| `SSH_PRIVATE_KEY` | приватный ключ целиком |
| `SSH_PORT` | если не 22 |
| `DEPLOY_PATH` | `/opt/gnomevpn` |
| `NEXT_PUBLIC_API_URL` | `https://api.gnomevpn.ru` |
| `TAURI_SIGNING_PRIVATE_KEY` | для автообновления десктопа |

### Ключ подписи обновлений

Нужен, чтобы приложение принимало обновления только от нас. Генерируется один раз:

```bash
bun --filter @gnomevpn/tauri signer:generate
```

Создаст два файла в `~/.tauri/` — вне репозитория, так ключ физически не может попасть в git.

Дальше:

1. Содержимое `~/.tauri/gnomevpn.key` целиком → секрет `TAURI_SIGNING_PRIVATE_KEY` в GitHub
2. Содержимое `~/.tauri/gnomevpn.key.pub` → `apps/tauri/tauri.conf.json`, поле `plugins.updater.pubkey`
3. Там же `"active": false` → `true`

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

**Сейчас их нет** — в разработке использовался `prisma db push`, история миграций не велась. До первого деплоя нужно её создать:

```bash
cd apps/server
bunx prisma migrate dev --name init
git add prisma/migrations && git commit -m "chore: add initial migration"
```

После этого `deploy-web.yml` будет применять миграции сам. Без этого шага деплой упадёт на шаге `migrate deploy`.

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
