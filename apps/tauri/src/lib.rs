#[cfg(mobile)]
pub mod mobile_vpn;
#[cfg(target_os = "windows")]
pub mod service;
pub mod vault;
#[cfg(target_os = "windows")]
pub mod vpn;

use tauri::Manager;

#[cfg(target_os = "windows")]
use service::commands::service_repair;
use vault::{vault_clear_token, vault_read_token, vault_save_token};
#[cfg(target_os = "windows")]
use vpn::commands::{vpn_connect, vpn_disconnect, vpn_service_available, vpn_status};
#[cfg(target_os = "windows")]
use vpn::state::VpnState;

const AUTOSTART_FLAG: &str = "--autostart";

fn started_by_autostart() -> bool {
    std::env::args().any(|arg| arg == AUTOSTART_FLAG)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();

    #[cfg(desktop)]
    let builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
        if let Some(window) = app.get_webview_window("main") {
            let _ = window.unminimize();
            let _ = window.show();
            let _ = window.set_focus();
        }
    }));

    #[cfg(desktop)]
    let builder = builder.plugin(tauri_plugin_updater::Builder::new().build());

    #[cfg(desktop)]
    let builder = builder.plugin(tauri_plugin_autostart::init(
        tauri_plugin_autostart::MacosLauncher::LaunchAgent,
        Some(vec!["--autostart"]),
    ));

    #[cfg(mobile)]
    let builder = builder
        .plugin(tauri_plugin_safe_area_insets_css::init())
        .plugin(mobile_vpn::plugin::init());

    let builder = builder
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
        .plugin({
            log::info!("registering tauri_plugin_os");
            tauri_plugin_os::init()
        })
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
                    #[cfg(desktop)]
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
        });

    #[cfg(target_os = "windows")]
    let builder = builder
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
        ]);

    #[cfg(mobile)]
    let builder = builder
        .manage(mobile_vpn::state::MobileVpnState::default())
        .invoke_handler(tauri::generate_handler![
            mobile_vpn::commands::vpn_connect,
            mobile_vpn::commands::vpn_disconnect,
            mobile_vpn::commands::vpn_status,
            mobile_vpn::commands::vpn_service_available,
            vault_save_token,
            vault_read_token,
            vault_clear_token
        ]);

    #[cfg(not(any(target_os = "windows", mobile)))]
    let builder = builder.invoke_handler(tauri::generate_handler![
        vault_save_token,
        vault_read_token,
        vault_clear_token
    ]);

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
