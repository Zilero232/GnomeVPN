use std::sync::Arc;

use gnomevpn_ipc::{SplitConfig, TunnelConfig, TunnelEvent};
use tauri::ipc::Channel;
use tauri::State;

use super::client::{ClientError, ServiceClient};
use super::state::VpnState;

#[tauri::command]
pub async fn vpn_connect(
    config: TunnelConfig,
    on_event: Channel<TunnelEvent>,
    auto_reconnect: Option<bool>,
    split: Option<SplitConfig>,
    state: State<'_, VpnState>,
) -> Result<(), ClientError> {
    log::info!("vpn_connect: asking the service to open a tunnel");

    let events = ServiceClient::connect()?;
    let emit: Arc<dyn Fn(TunnelEvent) + Send + Sync> = Arc::new(move |event| {
        let _ = on_event.send(event);
    });

    std::thread::spawn(move || events.pump_events(emit));

    let mut client = ServiceClient::connect()?;
    client.connect_tunnel(
        config,
        auto_reconnect.unwrap_or(true),
        split.unwrap_or_default(),
    )?;

    state.replace_connection(client);

    Ok(())
}

#[tauri::command]
pub async fn vpn_disconnect(state: State<'_, VpnState>) -> Result<(), ClientError> {
    log::info!("vpn_disconnect: asking the service to close the tunnel");

    ServiceClient::connect()?.disconnect_tunnel()?;
    state.clear_connection();

    Ok(())
}

#[tauri::command]
pub async fn vpn_status() -> Result<String, ClientError> {
    use gnomevpn_ipc::TunnelStatus;

    let status = match ServiceClient::connect() {
        Ok(mut client) => client.status()?,
        Err(ClientError::Unavailable(reason)) => {
            log::debug!("service unavailable: {reason}");
            TunnelStatus::Disconnected
        }
        Err(error) => return Err(error),
    };

    Ok(match status {
        TunnelStatus::Disconnected => "disconnected",
        TunnelStatus::Connecting => "connecting",
        TunnelStatus::Connected => "connected",
    }
    .to_string())
}

#[tauri::command]
pub async fn vpn_service_available() -> bool {
    ServiceClient::connect().is_ok()
}
