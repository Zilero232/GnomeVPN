# Android-оверлей

`gen/android` целиком генерируется командой `tauri android init` и стирается при
каждом её запуске, поэтому всё своё лежит здесь, а `scripts/setup-android-libs.mjs`
раскладывает это по сгенерированному проекту перед каждой android-командой.

Правьте файлы здесь. Правки в `gen/android` пропадут.

```text
java/                     копируется в app/src/main/java/app/gnomevpn/mobile/
├── GnomeVpnService.kt    VpnService: TUN-дескриптор, маршруты, DNS, уведомление
└── VpnPlugin.kt          Tauri-плагин: согласие пользователя, старт, стоп
libs/<abi>/libhysteria.so копируется в app/src/main/jniLibs/<abi>/
```

Скрипт дописывает в `AndroidManifest.xml` разрешения переднего плана и запись
`<service>` с `BIND_VPN_SERVICE` — без неё система не отдаст TUN-дескриптор.

## libhysteria.so

Тот же клиент Hysteria2, что и на Windows, только собранный под Android. Держит
туннель по QUIC/UDP: Rust поднимает его дочерним процессом (`hysteria client`) с
SOCKS-инбаундом на loopback, а `tun2proxy` переливает туда трафик из
TUN-дескриптора, который выдал `VpnService`.

Имя не случайное. Android распаковывает и разрешает выполнять только файлы вида
`lib*.so` из каталога нативных библиотек — обычный `hysteria` в `assets/`
запустить нельзя. Путь к каталогу берётся из `ApplicationInfo.nativeLibraryDir`,
а не собирается вручную: при установке в рабочий профиль или на SD-карту он другой.

- **Версия:** 2.10.0, сборки `android-arm64`, `android-armv7`, `android-386`,
  `android-amd64`
- **Источник:** <https://github.com/apernet/hysteria/releases>
- **Лицензия:** MIT

### Как обновить

1. Скачать `hysteria-android-{arm64,armv7,386,amd64}` из релизов
2. Положить каждый как `libhysteria.so` в соответствующий ABI:
   `arm64`→`arm64-v8a`, `armv7`→`armeabi-v7a`, `386`→`x86`, `amd64`→`x86_64`
3. Обновить версию в этом файле

Версия должна совпадать с `bin/hysteria/hysteria.exe`: конфиг генерируется одним
и тем же кодом из `crates/vpn-ipc`, и расхождение вылезет только в рантайме.
