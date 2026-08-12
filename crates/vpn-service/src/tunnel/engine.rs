use std::net::Ipv4Addr;
use std::sync::Arc;

use tokio::sync::oneshot;
use tokio::time::{interval, timeout, Duration};

use gnomevpn_ipc::{SplitConfig, TunnelConfig, TunnelEvent};

use super::adapter::{self, Traffic};
use super::singbox::{self, Singbox, SpawnInput};
use super::TunnelError;

const TUNNEL_NAME: &str = "gnomevpn0";
const TUNNEL_ADDRESS: Ipv4Addr = Ipv4Addr::new(10, 8, 0, 2);

const READY_TIMEOUT: Duration = Duration::from_secs(25);
const READY_INTERVAL: Duration = Duration::from_millis(400);
const WATCH_INTERVAL: Duration = Duration::from_secs(1);

const STALL_TIMEOUT: Duration = Duration::from_secs(60);
const STALL_MIN_BYTES: u64 = 32 * 1024;

#[cfg(target_os = "windows")]
const PROBE_TIMEOUT: Duration = Duration::from_secs(3);

#[cfg(target_os = "windows")]
const PROBE_TARGETS: [std::net::SocketAddr; 2] = [
    std::net::SocketAddr::new(std::net::IpAddr::V4(Ipv4Addr::new(1, 1, 1, 1)), 443),
    std::net::SocketAddr::new(std::net::IpAddr::V4(Ipv4Addr::new(8, 8, 8, 8)), 443),
];

async fn tunnel_is_up() -> bool {
    tokio::task::spawn_blocking(|| adapter::is_up(TUNNEL_NAME, TUNNEL_ADDRESS))
        .await
        .unwrap_or(false)
}

async fn traffic() -> Traffic {
    tokio::task::spawn_blocking(|| adapter::traffic(TUNNEL_NAME, TUNNEL_ADDRESS))
        .await
        .unwrap_or_default()
}

#[derive(Default)]
struct StallDetector {
    last_seen: Option<(u64, u64)>,
    deaf_for: Duration,
    asked: u64,
}

impl StallDetector {
    fn observe(&mut self, current: &Traffic) -> Option<String> {
        let (rx, tx) = self.last_seen.replace((current.rx, current.tx))?;

        if current.rx > rx {
            self.deaf_for = Duration::ZERO;
            self.asked = 0;

            return None;
        }

        let sent = current.tx.saturating_sub(tx);

        if sent == 0 {
            return None;
        }

        self.asked = self.asked.saturating_add(sent);
        self.deaf_for += WATCH_INTERVAL;

        if self.deaf_for < STALL_TIMEOUT || self.asked < STALL_MIN_BYTES {
            return None;
        }

        Some(format!("sent {} bytes over {}s with no reply", self.asked, self.deaf_for.as_secs()))
    }
}

#[cfg(target_os = "windows")]
async fn probe_through_tunnel(target: std::net::SocketAddr) -> bool {
    let Ok(socket) = tokio::net::TcpSocket::new_v4() else {
        return false;
    };

    let source = std::net::SocketAddr::V4(std::net::SocketAddrV4::new(TUNNEL_ADDRESS, 0));

    if socket.bind(source).is_err() {
        return false;
    }

    matches!(timeout(PROBE_TIMEOUT, socket.connect(target)).await, Ok(Ok(_)))
}

async fn tunnel_is_ready() -> bool {
    if !tunnel_is_up().await {
        return false;
    }

    #[cfg(target_os = "windows")]
    {
        for target in PROBE_TARGETS {
            if probe_through_tunnel(target).await {
                return true;
            }
        }

        false
    }

    #[cfg(not(target_os = "windows"))]
    true
}

async fn wait_until_ready(process: &mut Singbox) -> Result<(), TunnelError> {
    let mut ticker = interval(READY_INTERVAL);

    let probe = async {
        loop {
            ticker.tick().await;

            if let Some(reason) = process.has_exited() {
                return Err(TunnelError::Singbox(reason));
            }

            if tunnel_is_ready().await {
                return Ok(());
            }
        }
    };

    timeout(READY_TIMEOUT, probe)
        .await
        .map_err(|_| TunnelError::Singbox("tunnel did not come up in time".into()))?
}

pub async fn run_tunnel(
    config: Arc<TunnelConfig>,
    split: Arc<SplitConfig>,
    emit: Arc<dyn Fn(TunnelEvent) + Send + Sync>,
    mut stop: oneshot::Receiver<()>,
) -> Result<(), TunnelError> {
    log::info!(
        "connect requested: server={}:{} protocol={} dns={:?} split_rules={}",
        config.server,
        config.port,
        config.protocol.tag(),
        config.dns,
        !split.is_empty()
    );

    emit(TunnelEvent::Connecting);

    let mut process = singbox::spawn(SpawnInput {
        config: &config,
        split: &split,
    })
    .await?;

    let ready = tokio::select! {
        _ = &mut stop => {
            log::info!("stop requested during startup; aborting before the tunnel came up");
            process.stop().await;

            return Ok(());
        }
        ready = wait_until_ready(&mut process) => ready,
    };

    if let Err(error) = ready {
        log::error!("tunnel never became usable: {error}");
        process.stop().await;

        return Err(error);
    }

    log::info!("tunnel is up on {TUNNEL_ADDRESS}; sing-box owns routing");
    emit(TunnelEvent::Connected {
        assigned_ip: TUNNEL_ADDRESS.to_string(),
    });

    let mut watch = interval(WATCH_INTERVAL);
    let mut detector = StallDetector::default();

    let result = loop {
        tokio::select! {
            _ = &mut stop => {
                log::info!("stop requested; tearing the tunnel down");

                break Ok(());
            }

            _ = watch.tick() => {
                if let Some(reason) = process.has_exited() {
                    log::error!("sing-box exited while connected: {reason}");

                    break Err(TunnelError::Singbox(reason));
                }

                let traffic = traffic().await;

                emit(TunnelEvent::BytesUpdate {
                    rx: traffic.rx,
                    tx: traffic.tx,
                });

                if let Some(reason) = detector.observe(&traffic) {
                    log::error!("tunnel stalled: {reason}");

                    break Err(TunnelError::Stalled(reason));
                }
            }
        }
    };

    log::info!("tunnel loop ended ({result:?}); stopping sing-box");
    process.stop().await;
    emit(TunnelEvent::Disconnected);

    result
}
