use std::net::Ipv4Addr;
use std::sync::Arc;

use tokio::sync::oneshot;
use tokio::time::{interval, timeout, Duration};

use gnomevpn_ipc::{TunnelConfig, TunnelEvent};

use super::adapter::{self, Traffic};
use super::singbox::{self, Singbox, SpawnInput};
use super::TunnelError;

const TUNNEL_NAME: &str = "gnomevpn0";
const TUNNEL_ADDRESS: Ipv4Addr = Ipv4Addr::new(10, 8, 0, 2);

const READY_TIMEOUT: Duration = Duration::from_secs(20);
const READY_INTERVAL: Duration = Duration::from_millis(250);
const WATCH_INTERVAL: Duration = Duration::from_secs(1);

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

async fn wait_until_ready(process: &mut Singbox) -> Result<(), TunnelError> {
    let mut ticker = interval(READY_INTERVAL);

    let probe = async {
        loop {
            ticker.tick().await;

            if let Some(reason) = process.has_exited() {
                return Err(TunnelError::Singbox(reason));
            }

            if tunnel_is_up().await {
                return Ok(());
            }
        }
    };

    timeout(READY_TIMEOUT, probe)
        .await
        .map_err(|_| TunnelError::Singbox("sing-box did not bring the tunnel up in time".into()))?
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
        log::error!("sing-box never brought the tunnel up: {error}");
        process.stop().await;

        return Err(error);
    }

    log::info!("tunnel is up on {TUNNEL_ADDRESS}, sing-box owns routing");
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
