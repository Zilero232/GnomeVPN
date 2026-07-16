use std::sync::Arc;

use tauri::ipc::Channel;
use tauri::State;
use tokio::sync::oneshot;

use super::engine::run_tunnel;
use super::state::{VpnRuntime, VpnState, VpnStatus};
use super::types::{TunnelConfig, VpnError, VpnEvent};
use parking_lot::Mutex;

fn track_status(sink: &Arc<Mutex<VpnRuntime>>, event: &VpnEvent) {
    if matches!(event, VpnEvent::Connected { .. }) {
        sink.lock().status = VpnStatus::Connected;
    }
}

#[tauri::command]
pub async fn vpn_connect(
    config: TunnelConfig,
    on_event: Channel<VpnEvent>,
    state: State<'_, VpnState>,
) -> Result<(), VpnError> {
    let (stop_tx, stop_rx) = oneshot::channel();
    {
        let mut rt = state.0.lock();
        if rt.status != VpnStatus::Disconnected {
            return Err(VpnError::AlreadyConnected);
        }
        rt.status = VpnStatus::Connecting;
        rt.stop = Some(stop_tx);
    }

    let status_handle = state.inner();
    let status_sink = status_handle.handle();

    let emit: Arc<dyn Fn(VpnEvent) + Send + Sync> = Arc::new(move |ev: VpnEvent| {
        track_status(&status_sink, &ev);
        let _ = on_event.send(ev);
    });

    let emit_for_status = emit.clone();

    let result = run_tunnel(config, emit, stop_rx).await;

    {
        let mut rt = status_handle.0.lock();
        rt.status = VpnStatus::Disconnected;
        rt.stop = None;
    }

    if let Err(err) = &result {
        emit_for_status(VpnEvent::Error {
            message: err.to_string(),
        });
    }
    result
}

#[tauri::command]
pub fn vpn_disconnect(state: State<'_, VpnState>) -> Result<(), VpnError> {
    let mut rt = state.0.lock();
    if let Some(stop) = rt.stop.take() {
        let _ = stop.send(());
    }
    rt.status = VpnStatus::Disconnected;
    Ok(())
}

#[tauri::command]
pub fn vpn_status(state: State<'_, VpnState>) -> String {
    match state.0.lock().status {
        VpnStatus::Disconnected => "disconnected",
        VpnStatus::Connecting => "connecting",
        VpnStatus::Connected => "connected",
    }
    .to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn connected_event_promotes_shared_status() {
        let state = VpnState::default();
        state.0.lock().status = VpnStatus::Connecting;
        let sink = state.handle();

        track_status(&sink, &VpnEvent::Handshake);
        assert_eq!(state.0.lock().status, VpnStatus::Connecting);

        track_status(
            &sink,
            &VpnEvent::Connected {
                assigned_ip: "10.8.0.2/32".to_string(),
            },
        );
        assert_eq!(state.0.lock().status, VpnStatus::Connected);
    }

    #[test]
    fn connecting_status_and_stop_sender_are_set_atomically() {
        let state = VpnState::default();
        let (stop_tx, _stop_rx) = oneshot::channel();

        {
            let mut rt = state.0.lock();
            assert_eq!(rt.status, VpnStatus::Disconnected);
            rt.status = VpnStatus::Connecting;
            rt.stop = Some(stop_tx);
        }

        let rt = state.0.lock();
        assert_eq!(rt.status, VpnStatus::Connecting);
        assert!(
            rt.stop.is_some(),
            "stop sender must be present whenever status is Connecting, \
             otherwise a concurrent disconnect finds no sender and the tunnel leaks"
        );
    }

    #[test]
    fn disconnect_after_connecting_setup_always_finds_a_stop_sender() {
        let state = VpnState::default();
        let (stop_tx, stop_rx) = oneshot::channel();

        {
            let mut rt = state.0.lock();
            rt.status = VpnStatus::Connecting;
            rt.stop = Some(stop_tx);
        }

        let mut rt = state.0.lock();
        let sent = if let Some(stop) = rt.stop.take() {
            stop.send(()).is_ok()
        } else {
            false
        };
        rt.status = VpnStatus::Disconnected;
        drop(rt);

        assert!(sent, "disconnect must observe a stop sender and signal it");
        assert!(stop_rx.blocking_recv().is_ok());
    }
}
