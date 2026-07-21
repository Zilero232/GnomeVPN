use std::net::IpAddr;
use std::net::Ipv4Addr;
use std::net::SocketAddr;
use std::sync::Arc;

use tokio::sync::oneshot;
use tokio::time::{interval, timeout, Duration};
use tun2proxy::{ArgProxy, Args, CancellationToken, ProxyType, UserKey};

use gnomevpn_ipc::{TunnelConfig, TunnelEvent};

use super::route;
use super::tunio::TunIo;
use super::xray::{self, Credentials, Xray};
use super::TunnelError;

const TUNNEL_NAME: &str = "gnomevpn0";
const TUNNEL_ADDRESS: Ipv4Addr = Ipv4Addr::new(10, 8, 0, 2);
const TUNNEL_GATEWAY: Ipv4Addr = Ipv4Addr::new(10, 8, 0, 1);
const TUNNEL_PREFIX: u8 = 24;
const MTU: u16 = 1420;

const READY_TIMEOUT: Duration = Duration::from_secs(15);
const READY_INTERVAL: Duration = Duration::from_millis(200);
const WATCH_INTERVAL: Duration = Duration::from_secs(1);

async fn wait_until_ready(socks: SocketAddr, xray: &mut Xray) -> Result<(), TunnelError> {
    let mut ticker = interval(READY_INTERVAL);

    let probe = async {
        loop {
            ticker.tick().await;

            if let Some(reason) = xray.has_exited() {
                return Err(TunnelError::Xray(reason));
            }

            if tokio::net::TcpStream::connect(socks).await.is_ok() {
                return Ok(());
            }
        }
    };

    timeout(READY_TIMEOUT, probe)
        .await
        .map_err(|_| TunnelError::Xray("xray did not open its inbound in time".into()))?
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
    emit(TunnelEvent::Connecting);

    let server = resolve_server(&config)?;

    let (mut process, credentials) = xray::spawn(&config).await?;
    let socks = process.socks_addr();

    if let Err(error) = wait_until_ready(socks, &mut process).await {
        process.stop().await;

        return Err(error);
    }

    let _ = route::remove_default_route(TUNNEL_NAME, server);

    let device = match tun_rs::DeviceBuilder::new()
        .name(TUNNEL_NAME)
        .ipv4(TUNNEL_ADDRESS, TUNNEL_PREFIX, None)
        .mtu(MTU)
        .build_async()
    {
        Ok(device) => device,
        Err(error) => {
            process.stop().await;

            return Err(TunnelError::Tun(error.to_string()));
        }
    };

    if let Err(error) = route::apply_default_route(TUNNEL_NAME, server, IpAddr::V4(TUNNEL_GATEWAY))
    {
        process.stop().await;

        return Err(TunnelError::Io(format!("route: {error}")));
    }

    let args = proxy_args(socks, &credentials, &config.dns);
    let cancellation = CancellationToken::new();
    let (io, traffic) = TunIo::new(device);

    let mut proxy = Box::pin(tun2proxy::run(io, MTU, args, cancellation.clone()));

    emit(TunnelEvent::Connected {
        assigned_ip: TUNNEL_ADDRESS.to_string(),
    });

    let mut watch = interval(WATCH_INTERVAL);

    let result = loop {
        tokio::select! {
            _ = &mut stop => {
                cancellation.cancel();
                let _ = proxy.await;

                break Ok(());
            }

            finished = &mut proxy => {
                break match finished {
                    Ok(_) => Ok(()),
                    Err(error) => Err(TunnelError::Io(error.to_string())),
                };
            }

            _ = watch.tick() => {
                if let Some(reason) = process.has_exited() {
                    cancellation.cancel();
                    let _ = proxy.await;

                    break Err(TunnelError::Xray(reason));
                }

                emit(TunnelEvent::BytesUpdate {
                    rx: traffic.rx(),
                    tx: traffic.tx(),
                });
            }
        }
    };

    let _ = route::remove_default_route(TUNNEL_NAME, server);
    process.stop().await;
    emit(TunnelEvent::Disconnected);

    result
}
