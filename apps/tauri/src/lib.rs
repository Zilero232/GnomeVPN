pub mod apps;
pub mod latency;
#[cfg(mobile)]
pub mod mobile_vpn;
#[cfg(desktop)]
pub mod service;
pub mod vault;
#[cfg(desktop)]
pub mod vpn;

use tauri::Manager;

#[cfg(desktop)]
use service::commands::service_repair;
use vault::{vault_clear_token, vault_read_token, vault_save_token};
#[cfg(desktop)]
use vpn::commands::{vpn_connect, vpn_disconnect, vpn_service_available, vpn_status};
#[cfg(desktop)]
use vpn::state::VpnState;

const AUTOSTART_FLAG: &str = "--autostart";

#[cfg(all(desktop, not(debug_assertions)))]
const HARDEN_WEBVIEW_JS: &str = r#"
(() => {
  const blockKey = (event) => {
    const key = event.key.toLowerCase();
    const reload = key === 'f5' || ((event.ctrlKey || event.metaKey) && key === 'r');
    const devtools =
      key === 'f12' ||
      ((event.ctrlKey || event.metaKey) && event.shiftKey && (key === 'i' || key === 'j' || key === 'c')) ||
      ((event.ctrlKey || event.metaKey) && key === 'u');

    if (reload || devtools) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  window.addEventListener('keydown', blockKey, { capture: true });
  window.addEventListener('contextmenu', (event) => event.preventDefault(), { capture: true });
})();
"#;

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
        .plugin(tauri_plugin_dialog::init())
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

            Ok(())
        });

    #[cfg(desktop)]
    let builder = builder.on_page_load(|webview, payload| {
        #[cfg(not(debug_assertions))]
        if payload.event() == tauri::webview::PageLoadEvent::Started {
            let _ = webview.eval(HARDEN_WEBVIEW_JS);
        }

        if payload.event() == tauri::webview::PageLoadEvent::Finished && !started_by_autostart() {
            let window = webview.window();

            let _ = window.show();
            let _ = window.set_focus();
        }
    });

    #[cfg(desktop)]
    let builder = builder.manage(VpnState::default()).invoke_handler(tauri::generate_handler![
        vpn_connect,
        vpn_disconnect,
        vpn_status,
        vpn_service_available,
        service_repair,
        apps::list_installed_apps,
        apps::list_running_processes,
        latency::commands::vpn_probe_latency,
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
            mobile_vpn::commands::vpn_traffic,
            mobile_vpn::commands::vpn_service_available,
            mobile_vpn::commands::vpn_take_tile_request,
            mobile_vpn::commands::vpn_hide_window,
            mobile_vpn::commands::vpn_share_config,
            mobile_vpn::commands::vpn_has_permission,
            mobile_vpn::commands::vpn_request_permission,
            latency::commands::vpn_probe_latency,
            vault_save_token,
            vault_read_token,
            vault_clear_token
        ]);

    builder.run(tauri::generate_context!()).expect("error while running tauri application");
}
