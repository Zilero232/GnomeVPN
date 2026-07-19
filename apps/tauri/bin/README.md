# Нативные зависимости

## wintun.dll

Драйвер виртуального сетевого адаптера для Windows от авторов WireGuard.
Без него `tun-rs` не может создать TUN-интерфейс и `vpn_connect` падает
с `tun device error: LoadLibraryExW failed`.

- **Версия:** 0.14.1, сборка amd64 (x64)
- **Источник:** <https://www.wintun.net/builds/wintun-0.14.1.zip>
- **Лицензия:** см. `wintun-LICENSE.txt` (GPLv2 с исключением для линковки)

Linux и macOS в этом файле не нуждаются — TUN там встроен в ядро
(`/dev/net/tun` и `utun` соответственно).

### Как обновить

1. Скачать архив с <https://www.wintun.net>
2. Взять `wintun/bin/amd64/wintun.dll` и `wintun/LICENSE.txt`
3. Положить сюда, обновив версию в этом файле

### Куда попадает при сборке

`tauri.conf.json` → `bundle.resources` кладёт DLL рядом с `vesper.exe`.
Для `cargo run` / `tauri dev` файл должен лежать в `target/debug/`
(копируется скриптом `scripts/sync-wintun.mjs` через `predev`).

### Права администратора

Создание TUN-адаптера требует прав администратора даже при наличии DLL.
Запускайте `bun run tauri:dev` из терминала, открытого от имени администратора.
Устранение UAC на каждый Connect — задача Этапа 4 (привилегированный хелпер).
