use std::time::Duration;

use gnomevpn_ipc::TunnelEvent;
use tauri::ipc::Channel;
use tauri::Manager;
use tokio::time::interval;
use tun2proxy::CancellationToken;

use super::plugin::VpnPlugin;

const POLL_INTERVAL: Duration = Duration::from_secs(1);

// SELinux denies untrusted apps a read of /proc/net, so the byte counts come
// from android's own per-uid tally through TrafficStats rather than the
// interface table.
pub async fn report<R: tauri::Runtime>(
    app: tauri::AppHandle<R>,
    on_event: Channel<TunnelEvent>,
    cancellation: CancellationToken,
) {
    let mut ticker = interval(POLL_INTERVAL);

    loop {
        tokio::select! {
            _ = cancellation.cancelled() => return,
            _ = ticker.tick() => {
                let Ok(bytes) = app.state::<VpnPlugin<R>>().traffic() else { continue };

                let _ = on_event.send(TunnelEvent::BytesUpdate {
                    rx: bytes.rx,
                    tx: bytes.tx,
                });
            }
        }
    }
}
