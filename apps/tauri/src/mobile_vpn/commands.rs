use gnomevpn_ipc::{TunnelConfig, TunnelEvent};
use tauri::ipc::Channel;
use tauri::{AppHandle, Manager, Runtime, State};

use super::engine;
use super::plugin::{TrafficResult, VpnPlugin};
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
    let plugin = app.state::<VpnPlugin<R>>();
    let _ = &state;

    if let Err(error) = plugin.set_auto_reconnect(auto_reconnect.unwrap_or(true)) {
        log::warn!("cannot store the auto-reconnect preference: {error}");
    }

    log::info!("vpn_connect: opening the android tunnel");
    let _ = on_event.send(TunnelEvent::Connecting);

    start_service(&app, &config).await?;

    let _ = on_event.send(TunnelEvent::Connected {
        assigned_ip: engine::assigned_ip(&config),
    });

    Ok(())
}

async fn start_service<R: Runtime>(
    app: &AppHandle<R>,
    config: &TunnelConfig,
) -> Result<(), MobileVpnError> {
    let handle = app.clone();
    let config = config.clone();

    tauri::async_runtime::spawn_blocking(move || handle.state::<VpnPlugin<R>>().start(&config))
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
pub async fn vpn_open_settings<R: Runtime>(app: AppHandle<R>) -> Result<(), MobileVpnError> {
    app.state::<VpnPlugin<R>>().open_vpn_settings()
}

#[tauri::command]
pub async fn vpn_share_config<R: Runtime>(
    app: AppHandle<R>,
    file_name: String,
    content: String,
) -> Result<bool, MobileVpnError> {
    app.state::<VpnPlugin<R>>().share_config(file_name, content)
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
pub async fn vpn_traffic<R: Runtime>(app: AppHandle<R>) -> Result<TrafficResult, MobileVpnError> {
    app.state::<VpnPlugin<R>>().traffic()
}

#[tauri::command]
pub async fn vpn_status<R: Runtime>(
    app: AppHandle<R>,
    state: State<'_, MobileVpnState>,
) -> Result<&'static str, MobileVpnError> {
    let running = state.is_active()
        || app
            .try_state::<VpnPlugin<R>>()
            .is_some_and(|plugin| plugin.is_running().unwrap_or(false));

    Ok(if running { "connected" } else { "disconnected" })
}

#[tauri::command]
pub async fn vpn_service_available<R: Runtime>(app: AppHandle<R>) -> bool {
    app.try_state::<VpnPlugin<R>>().is_some()
}
