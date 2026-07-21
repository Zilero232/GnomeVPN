pub mod service;
pub mod vault;
pub mod vpn;

use tauri::Manager;

use service::commands::service_repair;
use vault::{vault_clear_token, vault_read_token, vault_save_token};
use vpn::commands::{vpn_connect, vpn_disconnect, vpn_service_available, vpn_status};
use vpn::state::VpnState;

const AUTOSTART_FLAG: &str = "--autostart";

fn started_by_autostart() -> bool {
    std::env::args().any(|arg| arg == AUTOSTART_FLAG)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();

    // On Windows a deep link opened while the app already runs starts a second
    // instance; single-instance (with the deep-link feature) routes its argv to
    // the plugin, which fires on_open_url in the primary instance. We only need
    // to surface the window — the webview handles the navigation.
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    let builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
        if let Some(window) = app.get_webview_window("main") {
            let _ = window.unminimize();
            let _ = window.show();
            let _ = window.set_focus();
        }
    }));

    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    let builder = builder.plugin(tauri_plugin_updater::Builder::new().build());

    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    let builder = builder.plugin(tauri_plugin_autostart::init(
        tauri_plugin_autostart::MacosLauncher::LaunchAgent,
        Some(vec!["--autostart"]),
    ));

    builder
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(log::LevelFilter::Info)
                .level_for("gnomevpn", log::LevelFilter::Debug)
                .targets([
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Stdout),
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::LogDir {
                        file_name: Some("gnomevpn".into()),
                    }),
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Webview),
                ])
                .max_file_size(5_000_000)
                .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepOne)
                .build(),
        )
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            use tauri_plugin_deep_link::DeepLinkExt;

            let handle = app.handle().clone();
            app.deep_link().on_open_url(move |_event| {
                if let Some(window) = handle.get_webview_window("main") {
                    let _ = window.unminimize();
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            });

            if !started_by_autostart() {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }

            Ok(())
        })
        .manage(VpnState::default())
        .invoke_handler(tauri::generate_handler![
            vpn_connect,
            vpn_disconnect,
            vpn_status,
            vpn_service_available,
            service_repair,
            vault_save_token,
            vault_read_token,
            vault_clear_token
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
