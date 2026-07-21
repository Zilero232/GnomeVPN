# Android-оверлей

`gen/android` целиком генерируется командой `tauri android init` и стирается при
каждом её запуске, поэтому всё своё лежит здесь, а `scripts/setup-android-libs.mjs`
раскладывает это по сгенерированному проекту перед каждой android-командой.

Правьте файлы здесь. Правки в `gen/android` пропадут.

```text
java/                     копируется в app/src/main/java/app/gnomevpn/mobile/
├── GnomeVpnService.kt    VpnService: TUN-дескриптор, маршруты, DNS, уведомление
└── VpnPlugin.kt          Tauri-плагин: согласие пользователя, старт, стоп
libs/<abi>/libxray.so     копируется в app/src/main/jniLibs/<abi>/
```

Скрипт дописывает в `AndroidManifest.xml` разрешения переднего плана и запись
`<service>` с `BIND_VPN_SERVICE` — без неё система не отдаст TUN-дескриптор.

## libxray.so

То же ядро Xray, что и на Windows, только собранное под Android. Держит туннель
VLESS + XTLS-Reality: Rust поднимает его дочерним процессом с SOCKS-инбаундом на
loopback, а `tun2proxy` переливает туда трафик из TUN-дескриптора, который выдал
`VpnService`.

Имя не случайное. Android распаковывает и разрешает выполнять только файлы вида
`lib*.so` из каталога нативных библиотек — обычный `xray` в `assets/` запустить
нельзя. Путь к каталогу берётся из `ApplicationInfo.nativeLibraryDir`, а не
собирается вручную: при установке в рабочий профиль или на SD-карту он другой.

- **Версия:** 26.3.27, сборки `android-arm64-v8a` и `android-amd64`
- **Источник:** <https://github.com/XTLS/Xray-core/releases>
- **Лицензия:** MPL-2.0 — см. `xray-LICENSE.txt`

### Как обновить

1. Скачать `Xray-android-arm64-v8a.zip` и `Xray-android-amd64.zip` из релизов
2. Положить `xray` из первого в `libs/arm64-v8a/libxray.so`, из второго — в
   `libs/x86_64/libxray.so` (amd64 нужен для эмулятора)
3. Обновить версию в этом файле

Версия должна совпадать с `bin/xray.exe`: конфиг генерируется одним и тем же
кодом из `crates/vpn-ipc`, и расхождение вылезет только в рантайме.
