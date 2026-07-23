fn main() {
    if std::env::var("CARGO_CFG_TARGET_OS").as_deref() == Ok("android") {
        for symbol in [
            "Java_app_gnomevpn_mobile_TunnelEngine_nativeStart",
            "Java_app_gnomevpn_mobile_TunnelEngine_nativeStop",
        ] {
            println!("cargo:rustc-link-arg-cdylib=-Wl,--undefined={symbol}");
        }
    }

    tauri_build::build();
}
