use std::net::ToSocketAddrs;
use std::sync::Arc;

use boringtun::noise::{Tunn, TunnResult};
use tokio::net::UdpSocket;
use tokio::sync::oneshot;
use tokio::time::{interval, Duration};

use super::types::{TunnelConfig, VpnError, VpnEvent};
use super::{parse_keys, route};

const MAX_PACKET: usize = 65535;
const TUNNEL_NAME: &str = "vesper0";

pub async fn run_tunnel(
    config: TunnelConfig,
    emit: Arc<dyn Fn(VpnEvent) + Send + Sync>,
    mut stop: oneshot::Receiver<()>,
) -> Result<(), VpnError> {
    emit(VpnEvent::Connecting);

    let (static_private, server_public) = parse_keys(&config)?;
    let keepalive = if config.persistent_keepalive == 0 {
        None
    } else {
        Some(config.persistent_keepalive)
    };

    let mut tunn = Tunn::new(static_private, server_public, None, keepalive, 0, None);

    let mut work = vec![0u8; MAX_PACKET];

    let endpoint = config
        .endpoint
        .to_socket_addrs()
        .map_err(|e| VpnError::Endpoint(e.to_string()))?
        .next()
        .ok_or_else(|| VpnError::Endpoint("no address".into()))?;

    let socket = UdpSocket::bind("0.0.0.0:0")
        .await
        .map_err(|e| VpnError::Io(e.to_string()))?;
    socket
        .connect(endpoint)
        .await
        .map_err(|e| VpnError::Io(e.to_string()))?;

    if let TunnResult::WriteToNetwork(b) = tunn.encapsulate(&[], &mut work) {
        let _ = socket.send(b).await;
    }

    let address = parse_cidr(&config.address)?;
    let dev = tun_rs::DeviceBuilder::new()
        .name(TUNNEL_NAME)
        .ipv4(address, 32, None)
        .mtu(1420)
        .build_async()
        .map_err(|e| VpnError::Tun(e.to_string()))?;

    route::apply_default_route(TUNNEL_NAME, endpoint.ip(), &config.dns)
        .map_err(|e| VpnError::Io(format!("route: {e}")))?;

    let mut tun_buf = vec![0u8; MAX_PACKET];
    let mut udp_buf = vec![0u8; MAX_PACKET];
    let mut timer = interval(Duration::from_millis(250));
    let mut connected = false;

    let result = loop {
        tokio::select! {
            _ = &mut stop => break Ok(()),

            r = dev.recv(&mut tun_buf) => {
                let n = match r {
                    Ok(n) => n,
                    Err(e) => break Err(VpnError::Tun(e.to_string())),
                };
                match tunn.encapsulate(&tun_buf[..n], &mut work) {
                    TunnResult::WriteToNetwork(b) => { let _ = socket.send(b).await; }
                    TunnResult::Err(e) => break Err(VpnError::Io(format!("encap: {e:?}"))),
                    _ => {}
                }
            }

            r = socket.recv(&mut udp_buf) => {
                let n = match r {
                    Ok(n) => n,
                    Err(e) => break Err(VpnError::Io(e.to_string())),
                };
                let mut datagram = &udp_buf[..n];
                loop {
                    match tunn.decapsulate(None, datagram, &mut work) {
                        TunnResult::WriteToNetwork(b) => {
                            let _ = socket.send(b).await;
                            datagram = &[];
                            continue;
                        }
                        TunnResult::WriteToTunnelV4(b, _) | TunnResult::WriteToTunnelV6(b, _) => {
                            let _ = dev.send(b).await;
                            if !connected {
                                connected = true;
                                emit(VpnEvent::Connected { assigned_ip: config.address.clone() });
                            }
                        }
                        TunnResult::Err(_) | TunnResult::Done => {}
                    }
                    break;
                }
            }

            _ = timer.tick() => {
                if let TunnResult::WriteToNetwork(b) = tunn.update_timers(&mut work) {
                    let _ = socket.send(b).await;
                }
            }
        }
    };

    let _ = route::remove_default_route(TUNNEL_NAME, endpoint.ip());
    emit(VpnEvent::Disconnected);
    result
}

fn parse_cidr(value: &str) -> Result<std::net::Ipv4Addr, VpnError> {
    let ip = value.split('/').next().unwrap_or(value);
    ip.parse()
        .map_err(|_| VpnError::Endpoint(format!("bad address {value}")))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_ipv4_from_cidr() {
        let ip = parse_cidr("10.8.0.2/32").unwrap();
        assert_eq!(ip, std::net::Ipv4Addr::new(10, 8, 0, 2));
    }

    #[test]
    fn parses_ipv4_without_prefix() {
        let ip = parse_cidr("10.8.0.2").unwrap();
        assert_eq!(ip, std::net::Ipv4Addr::new(10, 8, 0, 2));
    }

    #[test]
    fn rejects_invalid_address() {
        assert!(matches!(
            parse_cidr("not-an-ip"),
            Err(VpnError::Endpoint(_))
        ));
    }

    #[test]
    fn rejects_empty_address() {
        assert!(matches!(parse_cidr(""), Err(VpnError::Endpoint(_))));
    }
}
