use std::net::IpAddr;
use std::net::Ipv4Addr;
use std::net::SocketAddr;
use std::sync::Arc;

use tokio::sync::oneshot;
use tokio::time::{interval, timeout, Duration};
use tun2proxy::{ArgProxy, Args, CancellationToken, ProxyType, UserKey};

use gnomevpn_ipc::{TunnelConfig, TunnelEvent};

use super::hysteria::{self, Credentials, Hysteria};
use super::route;
use super::tunio::TunIo;
use super::TunnelError;

const TUNNEL_NAME: &str = "gnomevpn0";
const TUNNEL_ADDRESS: Ipv4Addr = Ipv4Addr::new(10, 8, 0, 2);
const TUNNEL_GATEWAY: Ipv4Addr = Ipv4Addr::new(10, 8, 0, 1);
const TUNNEL_PREFIX: u8 = 24;
const MTU: u16 = 1420;

const READY_TIMEOUT: Duration = Duration::from_secs(15);
const READY_INTERVAL: Duration = Duration::from_millis(200);
const WATCH_INTERVAL: Duration = Duration::from_secs(1);

async fn wait_until_ready(socks: SocketAddr, hysteria: &mut Hysteria) -> Result<(), TunnelError> {
    let mut ticker = interval(READY_INTERVAL);

    let probe = async {
        loop {
            ticker.tick().await;

            if let Some(reason) = hysteria.has_exited() {
                return Err(TunnelError::Hysteria(reason));
            }

            if tokio::net::TcpStream::connect(socks).await.is_ok() {
                return Ok(());
            }
        }
    };

    timeout(READY_TIMEOUT, probe)
        .await
        .map_err(|_| TunnelError::Hysteria("hysteria did not open its inbound in time".into()))?
}

fn resolve_server(config: &TunnelConfig) -> Result<IpAddr, TunnelError> {
    use std::net::ToSocketAddrs;

    (config.server.as_str(), config.port)
        .to_socket_addrs()
        .map_err(|error| TunnelError::Endpoint(error.to_string()))?
        .next()
        .map(|addr| addr.ip())
        .ok_or_else(|| TunnelError::Endpoint(format!("cannot resolve {}", config.server)))
}

fn proxy_args(socks: SocketAddr, credentials: &Credentials, dns: &[String]) -> Args {
    let mut args = Args::default();

    args.proxy(ArgProxy {
        proxy_type: ProxyType::Socks5,
        addr: socks,
        credentials: Some(UserKey::new(&credentials.user, &credentials.password)),
    })
    .tun(TUNNEL_NAME.to_string())
    .setup(false);

    if let Some(server) = dns.iter().find_map(|entry| entry.parse::<IpAddr>().ok()) {
        args.dns_addr(server);
    }

    args
}

pub async fn run_tunnel(
    config: TunnelConfig,
    emit: Arc<dyn Fn(TunnelEvent) + Send + Sync>,
    mut stop: oneshot::Receiver<()>,
) -> Result<(), TunnelError> {
    log::info!(
        "connect requested: server={}:{} protocol=hysteria2 sni={} insecure={} dns={:?}",
        config.server,
        config.port,
        config.server_name,
        config.insecure,
        config.dns
    );

    emit(TunnelEvent::Connecting);

    let server = resolve_server(&config)?;
    log::info!("resolved {} -> {server}", config.server);

    let (mut process, credentials) = hysteria::spawn(&config).await?;
    let socks = process.socks_addr();
    log::info!("hysteria started, socks inbound on {socks}, waiting for it to open");

    if let Err(error) = wait_until_ready(socks, &mut process).await {
        log::error!("hysteria inbound never opened: {error}");
        process.stop().await;

        return Err(error);
    }

    log::info!("hysteria inbound is open; installing routes to node {server}");
    let _ = route::remove_default_route(TUNNEL_NAME, server);

    let device = match tun_rs::DeviceBuilder::new()
        .name(TUNNEL_NAME)
        .ipv4(TUNNEL_ADDRESS, TUNNEL_PREFIX, None)
        .mtu(MTU)
        .build_async()
    {
        Ok(device) => device,
        Err(error) => {
            log::error!("wintun device {TUNNEL_NAME} failed: {error}");
            process.stop().await;

            return Err(TunnelError::Tun(error.to_string()));
        }
    };

    if let Err(error) = route::apply_default_route(TUNNEL_NAME, server, IpAddr::V4(TUNNEL_GATEWAY))
    {
        log::error!("applying default route failed: {error}");
        process.stop().await;

        return Err(TunnelError::Io(format!("route: {error}")));
    }

    let args = proxy_args(socks, &credentials, &config.dns);
    let cancellation = CancellationToken::new();
    let (io, traffic) = TunIo::new(device);

    let mut proxy = Box::pin(tun2proxy::run(io, MTU, args, cancellation.clone()));

    log::info!("routes in place, tun2proxy running; tunnel is up on {TUNNEL_ADDRESS}");
    emit(TunnelEvent::Connected {
        assigned_ip: TUNNEL_ADDRESS.to_string(),
    });

    let mut watch = interval(WATCH_INTERVAL);
    let mut ticks: u64 = 0;

    let result = loop {
        tokio::select! {
            _ = &mut stop => {
                log::info!("stop requested; tearing the tunnel down");
                cancellation.cancel();
                let _ = proxy.await;

                break Ok(());
            }

            finished = &mut proxy => {
                break match finished {
                    Ok(_) => {
                        log::warn!("tun2proxy exited on its own");
                        Ok(())
                    }
                    Err(error) => {
                        log::error!("tun2proxy failed: {error}");
                        Err(TunnelError::Io(error.to_string()))
                    }
                };
            }

            _ = watch.tick() => {
                if let Some(reason) = process.has_exited() {
                    log::error!("hysteria exited while connected: {reason}");
                    cancellation.cancel();
                    let _ = proxy.await;

                    break Err(TunnelError::Hysteria(reason));
                }

                ticks += 1;
                if ticks.is_multiple_of(5) {
                    log::info!("traffic so far: rx={} tx={}", traffic.rx(), traffic.tx());
                }

                emit(TunnelEvent::BytesUpdate {
                    rx: traffic.rx(),
                    tx: traffic.tx(),
                });
            }
        }
    };

    log::info!("tunnel loop ended ({result:?}); removing routes and stopping hysteria");
    let _ = route::remove_default_route(TUNNEL_NAME, server);
    process.stop().await;
    emit(TunnelEvent::Disconnected);

    result
}
