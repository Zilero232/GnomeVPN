use gnomevpn_ipc::{TunnelConfig, TunnelEvent};
use tauri::ipc::Channel;
use tauri::{AppHandle, Manager, Runtime, State};
use tun2proxy::CancellationToken;

use super::engine::{proxy_args, run_tun2proxy, spawn_xray};
use super::plugin::VpnPlugin;
use super::state::MobileVpnState;
use super::MobileVpnError;

const TUN_ADDRESS: &str = "10.8.0.2";

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

    let (xray, credentials) = spawn_xray(&app, &config).await?;

    let fd = match request_descriptor(&app, &config).await {
        Ok(fd) => fd,
        Err(error) => {
            xray.stop().await;

            return Err(error);
        }
    };

    let args = proxy_args(xray.socks_addr(), &credentials, &config.dns);

    let cancellation = CancellationToken::new();
    state.arm(cancellation.clone());

    let handle = app.clone();

    tauri::async_runtime::spawn(async move {
        let _ = on_event.send(TunnelEvent::Connected {
            assigned_ip: TUN_ADDRESS.into(),
        });

        if let Err(error) = run_tun2proxy(args, fd, cancellation).await {
            log::error!("android tunnel stopped: {error}");
            let _ = on_event.send(TunnelEvent::Error {
                message: error.to_string(),
            });
        }

        xray.stop().await;
        let _ = handle.state::<VpnPlugin<R>>().stop();
        let _ = on_event.send(TunnelEvent::Disconnected);
    });

    Ok(())
}

// The Kotlin side blocks until VpnService.establish() returns, so the call has
// to leave the async runtime rather than stall it.
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
    app.state::<VpnPlugin<R>>().stop()?;

    Ok(())
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
