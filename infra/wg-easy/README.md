# GnomeVPN node (wg-easy)

Один узел = одна страна. Разворачивается на VPS в целевой стране; backend ходит в его REST API,
клиенты — только в WireGuard-порт.

## Требования

- Docker + docker compose
- Публичный IP (или домен), указывающий на этот VPS
- Открытый наружу `51820/udp`. Порт `51821/tcp` (REST/панель) публикуется наружу, но доступ к нему
  ограничивается firewall'ом: `ufw allow from <IP backend'а> to any port 51821 proto tcp`.
  Именно это делает `bun run provision:nodes --backend-ip=<IP>` — **без этого флага панель
  окажется открыта всему интернету** (защищена только паролем).

## Настройка

1. Сгенерировать bcrypt-хеш пароля REST-панели:

```bash
docker run --rm ghcr.io/wg-easy/wg-easy:14 \
  node -e "console.log(require('bcryptjs').hashSync(process.argv[1], 12))" 'ВАШ_ПАРОЛЬ'
```

2. Создать `.env` рядом с `docker-compose.yml`:

```env
WG_HOST=203.0.113.10
WG_EASY_PASSWORD_HASH=$$2a$$12$$...сгенерированный.хеш...
```

Остальное берётся из дефолтов wg-easy: подсеть `10.8.0.x`, DNS `1.1.1.1`,
`AllowedIPs = 0.0.0.0/0, ::/0`. В `docker-compose.yml` задан только
`WG_PERSISTENT_KEEPALIVE=25` — его дефолт (`0`) отключил бы keepalive
и туннель отваливался бы за NAT.

**Каждый `$` в хеше нужно удвоить (`$$`).** docker compose раскрывает `$foo` как переменную:
с одиночными долларами bcrypt-хеш приедет в контейнер обрезанным, и любой REST-запрос будет
падать (проверено). Удвоить можно так:

```bash
docker run --rm ghcr.io/wg-easy/wg-easy:14 \
  node -e "console.log(require('bcryptjs').hashSync(process.argv[1], 12))" 'ВАШ_ПАРОЛЬ' \
  | sed 's/\$/$$/g'
```

Проверить, что хеш доехал целым: `docker exec gnomevpn-wg-easy printenv PASSWORD_HASH`.

3. Поднять узел:

```bash
docker compose up -d
docker compose logs -f wg-easy
```

## Регистрация узла в GnomeVPN

В таблице `node` backend хранит:

- `wgEasyUrl` — адрес REST API узла: `http://203.0.113.10:51821`. Доступ к порту ограничен
  firewall'ом на IP backend'а (см. «Требования»).
- `wgEasyApiKeyEnvVar` — **имя переменной окружения** backend'а, в которой лежит пароль панели
  (не сам пароль). Например `WG_KEY_DE`; тогда в окружении backend'а должно быть `WG_KEY_DE=ВАШ_ПАРОЛЬ`.
- `wireguardEndpoint` — то, что попадёт клиенту как endpoint: `203.0.113.10:51820`.

## Особенности API wg-easy 14 (проверено на живом узле)

- Аутентификация REST: заголовок `Authorization: <пароль>` — **без** префикса `Bearer`.
  Сервер сверяет значение заголовка с `PASSWORD_HASH` через bcrypt.
- `POST /api/wireguard/client` возвращает только `{"success":true}` — ключей в ответе нет.
  Приватный ключ, адрес, DNS и публичный ключ сервера читаются из
  `GET /api/wireguard/client/:id/configuration` (WireGuard-конфиг в ini-формате).
- Отдельного `GET /api/wireguard/client/:id` нет — список клиентов отдаёт
  `GET /api/wireguard/client` (там же `latestHandshakeAt`).
- `PASSWORD_HASH` — актуальная переменная; `INIT_PASSWORD` в этой версии не задаёт пароль панели.

## Проверка

```bash
curl -s -H "Authorization: ВАШ_ПАРОЛЬ" http://127.0.0.1:51821/api/release
curl -s -H "Authorization: ВАШ_ПАРОЛЬ" http://127.0.0.1:51821/api/wireguard/client
```
