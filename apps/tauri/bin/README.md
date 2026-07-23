# Нативные зависимости

## wintun.dll

Драйвер виртуального сетевого адаптера для Windows от авторов WireGuard.
Без него `tun-rs` не может создать TUN-интерфейс и `vpn_connect` падает
с `tun device error: LoadLibraryExW failed`.

- **Версия:** 0.14.1, сборка amd64 (x64)
- **Источник:** <https://www.wintun.net/builds/wintun-0.14.1.zip>
- **Лицензия:** см. `wintun-LICENSE.txt` — проприетарная «Prebuilt Binaries
  License» от WireGuard LLC, не GPL. Пункт 3(d) разрешает распространять DLL
  вместе с ПО, которое использует её только через публичный API (наш случай).
  Модифицировать DLL и удалять из неё копирайты нельзя.

Linux и macOS в этом файле не нуждаются — TUN там встроен в ядро
(`/dev/net/tun` и `utun` соответственно).

### Как обновить wintun

1. Скачать архив с <https://www.wintun.net>
2. Взять `wintun/bin/amd64/wintun.dll` и `wintun/LICENSE.txt`
3. Положить сюда, обновив версию в этом файле

### Куда попадает при сборке

`tauri.windows.conf.json` → `bundle.resources` кладёт DLL в корень
установки, рядом с `GnomeVPN.exe` и `gnomevpn-service.exe`. Соседство
со службой обязательно: TUN-адаптер создаёт именно она, а `tun-rs`
грузит DLL через `LoadLibraryExW` из каталога своего процесса.

Конфиг именно платформенный — в базовом `tauri.conf.json` эти ресурсы
ломают сборку под Linux и macOS.

Для `cargo run` / `tauri dev` файл должен лежать в `target/debug/`
(копируется скриптом `scripts/sync-bin.mjs` через `predev`).

### Права администратора

Создание TUN-адаптера требует прав администратора даже при наличии DLL.
Запускайте `bun run tauri:dev` из терминала, открытого от имени администратора.
Устранение UAC на каждый Connect — задача Этапа 4 (привилегированный хелпер).

## hysteria/hysteria.exe

Клиент Hysteria2 — держит туннель по QUIC/UDP. Служба поднимает его
дочерним процессом (`hysteria client -c ...`) с SOCKS-инбаундом на loopback
и переливает туда трафик из TUN-адаптера. Без файла `vpn_connect` падает с
`hysteria error: hysteria.exe not found next to the service`.

- **Версия:** 2.10.0, сборка windows-amd64
- **Источник:** <https://github.com/apernet/hysteria/releases>
- **Лицензия:** MIT

### Как обновить hysteria

1. Скачать `hysteria-windows-amd64.exe` из релизов apernet/hysteria
2. Переименовать в `hysteria.exe` и положить в `hysteria/`
3. Обновить версию в этом файле

Кладётся рядом со службой тем же `tauri.windows.conf.json`, а для dev-запуска
копируется в `target/debug/` скриптом `scripts/sync-bin.mjs`.

## Структура папок

Бинарники разложены по подпапкам источника (`hysteria/`, `wintun/`,
`service/`), но при сборке и dev-запуске кладутся **плоско** рядом со службой —
она ищет их в каталоге своего процесса. `service/gnomevpn-service.exe`
собирается скриптом `scripts/build-service.mjs`.
