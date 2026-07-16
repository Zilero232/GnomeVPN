use parking_lot::Mutex;
use std::sync::Arc;
use tokio::sync::oneshot;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum VpnStatus {
    Disconnected,
    Connecting,
    Connected,
}

pub struct VpnRuntime {
    pub status: VpnStatus,
    pub stop: Option<oneshot::Sender<()>>,
}

impl Default for VpnRuntime {
    fn default() -> Self {
        Self {
            status: VpnStatus::Disconnected,
            stop: None,
        }
    }
}

pub struct VpnState(pub Arc<Mutex<VpnRuntime>>);

impl VpnState {
    pub fn handle(&self) -> Arc<Mutex<VpnRuntime>> {
        Arc::clone(&self.0)
    }
}

impl Default for VpnState {
    fn default() -> Self {
        Self(Arc::new(Mutex::new(VpnRuntime::default())))
    }
}
