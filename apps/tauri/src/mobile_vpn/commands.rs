use gnomevpn_ipc::{TunnelConfig, TunnelEvent};
use tauri::ipc::Channel;
use tauri::{AppHandle, Manager, Runtime, State};
use tun2proxy::CancellationToken;

use super::counters::report;
use super::engine;
use super::plugin::VpnPlugin;
use super::state::MobileVpnState;
use super::MobileVpnError;

#[tauri::command]
pub async fn vpn_connect<R: Runtime>(
    app: AppHandle<R>,
    config: TunnelConfig,
    on_event: Channel<TunnelEvent>,
    auto_reconnect: Option<bool>,
    state: State<'_, MobileVpnState>,
) -> Result<(), MobileVpnError> {
    if auto_reconnect.unwrap_or(true) {
        log::debug!("auto-reconnect is not implemented on android yet");
    }

    log::info!("vpn_connect: opening the android tunnel");
    let _ = on_event.send(TunnelEvent::Connecting);

    let plugin = app.state::<VpnPlugin<R>>();
    let native_lib_dir = plugin.native_library_dir()?;
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| MobileVpnError::Service(error.to_string()))?;

    let fd = request_descriptor(&app, &config).await?;

    if let Err(error) = plugin.remember_tunnel(&config) {
        log::warn!("cannot store the session for the tile: {error}");
    }

    let cancellation = CancellationToken::new();
    state.arm(cancellation.clone());

    let handle = app.clone();
    let config = config.clone();

    tauri::async_runtime::spawn(async move {
        let _ = on_event.send(TunnelEvent::Connected {
            assigned_ip: engine::assigned_ip().into(),
        });

        tauri::async_runtime::spawn(report(
            handle.clone(),
            on_event.clone(),
            cancellation.clone(),
        ));

        if let Err(error) =
            engine::run_tunnel(&native_lib_dir, &data_dir, &config, fd, cancellation).await
        {
            log::error!("android tunnel stopped: {error}");
            let _ = on_event.send(TunnelEvent::Error {
                message: error.to_string(),
            });
        }

        let _ = handle.state::<VpnPlugin<R>>().stop();
        let _ = on_event.send(TunnelEvent::Disconnected);
    });

    Ok(())
}

async fn request_descriptor<R: Runtime>(
    app: &AppHandle<R>,
    config: &TunnelConfig,
) -> Result<i32, MobileVpnError> {
    let handle = app.clone();
    let server = config.server.clone();
    let dns = config.dns.clone();

    tauri::async_runtime::spawn_blocking(move || {
        handle.state::<VpnPlugin<R>>().start(&server, &dns)
    })
    .await
    .map_err(|error| MobileVpnError::Service(error.to_string()))?
}

#[tauri::command]
pub async fn vpn_disconnect<R: Runtime>(
    app: AppHandle<R>,
    state: State<'_, MobileVpnState>,
) -> Result<(), MobileVpnError> {
    log::info!("vpn_disconnect: closing the android tunnel");

    state.cancel();

    let plugin = app.state::<VpnPlugin<R>>();

    if let Err(error) = plugin.forget_tunnel() {
        log::warn!("cannot drop the stored session: {error}");
    }

    plugin.stop()?;

    Ok(())
}

#[tauri::command]
pub async fn vpn_take_tile_request<R: Runtime>(app: AppHandle<R>) -> Result<bool, MobileVpnError> {
    app.state::<VpnPlugin<R>>().take_auto_connect()
}

#[tauri::command]
pub async fn vpn_hide_window<R: Runtime>(app: AppHandle<R>) -> Result<(), MobileVpnError> {
    app.state::<VpnPlugin<R>>().move_to_background()
}

#[tauri::command]
pub async fn vpn_has_permission<R: Runtime>(app: AppHandle<R>) -> Result<bool, MobileVpnError> {
    app.state::<VpnPlugin<R>>().has_permission()
}

#[tauri::command]
pub async fn vpn_request_permission<R: Runtime>(app: AppHandle<R>) -> Result<bool, MobileVpnError> {
    let handle = app.clone();

    tauri::async_runtime::spawn_blocking(move || {
        handle.state::<VpnPlugin<R>>().request_permission()
    })
    .await
    .map_err(|error| MobileVpnError::Service(error.to_string()))?
}

#[tauri::command]
pub async fn vpn_status(state: State<'_, MobileVpnState>) -> Result<&'static str, MobileVpnError> {
    Ok(if state.is_active() {
        "connected"
    } else {
        "disconnected"
    })
}

#[tauri::command]
pub async fn vpn_service_available<R: Runtime>(app: AppHandle<R>) -> bool {
    app.try_state::<VpnPlugin<R>>().is_some()
}
