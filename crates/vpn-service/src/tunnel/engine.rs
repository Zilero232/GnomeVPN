use std::net::{Ipv4Addr, SocketAddr};
use std::sync::Arc;

use tokio::net::TcpStream;
use tokio::sync::oneshot;
use tokio::time::{interval, timeout, Duration};

use gnomevpn_ipc::{TunnelConfig, TunnelEvent};

use super::adapter::{self, Traffic};
use super::singbox::{self, Singbox, SpawnInput};
use super::TunnelError;

const TUNNEL_NAME: &str = "gnomevpn0";
const TUNNEL_ADDRESS: Ipv4Addr = Ipv4Addr::new(10, 8, 0, 2);

const READY_TIMEOUT: Duration = Duration::from_secs(25);
const READY_INTERVAL: Duration = Duration::from_millis(400);
const PROBE_TIMEOUT: Duration = Duration::from_secs(3);
const WATCH_INTERVAL: Duration = Duration::from_secs(1);

const PROBE_TARGETS: [SocketAddr; 2] = [
    SocketAddr::new(std::net::IpAddr::V4(Ipv4Addr::new(1, 1, 1, 1)), 443),
    SocketAddr::new(std::net::IpAddr::V4(Ipv4Addr::new(8, 8, 8, 8)), 443),
];

async fn tunnel_is_up() -> bool {
    tokio::task::spawn_blocking(|| adapter::is_up(TUNNEL_NAME))
        .await
        .unwrap_or(false)
}

async fn traffic() -> Traffic {
    tokio::task::spawn_blocking(|| adapter::traffic(TUNNEL_NAME))
        .await
        .unwrap_or_default()
}

async fn tunnel_carries_traffic() -> bool {
    for target in PROBE_TARGETS {
        if let Ok(Ok(_)) = timeout(PROBE_TIMEOUT, TcpStream::connect(target)).await {
            return true;
        }
    }

    false
}

async fn wait_until_ready(process: &mut Singbox) -> Result<(), TunnelError> {
    let mut ticker = interval(READY_INTERVAL);

    let probe = async {
        loop {
            ticker.tick().await;

            if let Some(reason) = process.has_exited() {
                return Err(TunnelError::Singbox(reason));
            }

            if tunnel_is_up().await && tunnel_carries_traffic().await {
                return Ok(());
            }
        }
    };

    timeout(READY_TIMEOUT, probe)
        .await
        .map_err(|_| TunnelError::Singbox("tunnel did not start carrying traffic in time".into()))?
}

pub async fn run_tunnel(
    config: TunnelConfig,
    split_apps: Vec<String>,
    emit: Arc<dyn Fn(TunnelEvent) + Send + Sync>,
    mut stop: oneshot::Receiver<()>,
) -> Result<(), TunnelError> {
    log::info!(
        "connect requested: server={}:{} protocol=hysteria2 sni={} insecure={} dns={:?} split_apps={}",
        config.server,
        config.port,
        config.server_name,
        config.insecure,
        config.dns,
        split_apps.len()
    );

    emit(TunnelEvent::Connecting);

    let mut process = singbox::spawn(SpawnInput {
        config: &config,
        split_apps: &split_apps,
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

    log::info!("tunnel is up on {TUNNEL_ADDRESS} and carrying traffic; sing-box owns routing");
    emit(TunnelEvent::Connected {
        assigned_ip: TUNNEL_ADDRESS.to_string(),
    });

    let mut watch = interval(WATCH_INTERVAL);

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
            }
        }
    };

    log::info!("tunnel loop ended ({result:?}); stopping sing-box");
    process.stop().await;
    emit(TunnelEvent::Disconnected);

    result
}
