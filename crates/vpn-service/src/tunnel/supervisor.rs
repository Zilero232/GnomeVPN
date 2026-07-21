use std::sync::Arc;

use gnomevpn_ipc::{validate_tunnel_config, TunnelConfig, TunnelEvent, TunnelStatus};
use parking_lot::Mutex;
use tokio::sync::{broadcast, oneshot};

const EVENT_BUFFER: usize = 64;

#[derive(Debug, thiserror::Error)]
pub enum SupervisorError {
    #[error("tunnel is already running")]
    AlreadyRunning,
    #[error("rejected config: {0}")]
    Rejected(#[from] gnomevpn_ipc::ValidationError),
}

struct Runtime {
    status: TunnelStatus,
    stop: Option<oneshot::Sender<()>>,
    pending_stop_rx: Option<oneshot::Receiver<()>>,
    auto_reconnect: bool,
    clients: usize,
}

pub struct Supervisor {
    runtime: Arc<Mutex<Runtime>>,
    events: broadcast::Sender<TunnelEvent>,
}

impl Default for Supervisor {
    fn default() -> Self {
        Self::new()
    }
}

impl Supervisor {
    pub fn new() -> Self {
        let (events, _) = broadcast::channel(EVENT_BUFFER);

        Self {
            runtime: Arc::new(Mutex::new(Runtime {
                status: TunnelStatus::Disconnected,
                stop: None,
                pending_stop_rx: None,
                auto_reconnect: true,
                clients: 0,
            })),
            events,
        }
    }

    pub fn client_connected(&self) {
        self.runtime.lock().clients += 1;
    }

    pub fn client_disconnected(&self) -> bool {
        let mut runtime = self.runtime.lock();
        runtime.clients = runtime.clients.saturating_sub(1);

        runtime.clients == 0
    }

    pub fn has_clients(&self) -> bool {
        self.runtime.lock().clients > 0
    }

    pub fn status(&self) -> TunnelStatus {
        self.runtime.lock().status
    }

    pub fn auto_reconnect_enabled(&self) -> bool {
        self.runtime.lock().auto_reconnect
    }

    pub fn set_options(&self, auto_reconnect: bool) {
        self.runtime.lock().auto_reconnect = auto_reconnect;
    }

    pub fn subscribe(&self) -> broadcast::Receiver<TunnelEvent> {
        self.events.subscribe()
    }

    pub fn publish(&self, event: TunnelEvent) {
        if let TunnelEvent::Connected { .. } = event {
            self.runtime.lock().status = TunnelStatus::Connected;
        }

        let _ = self.events.send(event);
    }

    pub fn begin(&self, config: &TunnelConfig) -> Result<(), SupervisorError> {
        validate_tunnel_config(config)?;

        let mut runtime = self.runtime.lock();

        if runtime.status != TunnelStatus::Disconnected {
            return Err(SupervisorError::AlreadyRunning);
        }

        let (stop_tx, stop_rx) = oneshot::channel();
        runtime.status = TunnelStatus::Connecting;
        runtime.stop = Some(stop_tx);
        runtime.pending_stop_rx = Some(stop_rx);

        Ok(())
    }

    pub fn take_stop_receiver(&self) -> Option<oneshot::Receiver<()>> {
        self.runtime.lock().pending_stop_rx.take()
    }

    pub fn stop(&self) {
        let mut runtime = self.runtime.lock();

        if let Some(stop) = runtime.stop.take() {
            let _ = stop.send(());
        }

        runtime.status = TunnelStatus::Disconnected;
    }

    pub fn finish(&self) {
        let mut runtime = self.runtime.lock();
        runtime.status = TunnelStatus::Disconnected;
        runtime.stop = None;
        runtime.pending_stop_rx = None;
    }
}
