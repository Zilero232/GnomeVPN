use parking_lot::Mutex;
use tun2proxy::CancellationToken;

#[derive(Default)]
pub struct MobileVpnState {
    inner: Mutex<Option<CancellationToken>>,
}

impl MobileVpnState {
    pub fn arm(&self, token: CancellationToken) {
        if let Some(previous) = self.inner.lock().replace(token) {
            previous.cancel();
        }
    }

    pub fn cancel(&self) {
        if let Some(token) = self.inner.lock().take() {
            token.cancel();
        }
    }

    pub fn is_active(&self) -> bool {
        self.inner
            .lock()
            .as_ref()
            .is_some_and(|token| !token.is_cancelled())
    }
}
