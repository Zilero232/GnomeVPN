use std::net::ToSocketAddrs;
use std::sync::Arc;

use boringtun::noise::{Tunn, TunnResult};
use tokio::net::UdpSocket;
use tokio::sync::oneshot;
use tokio::time::{interval, Duration};

use super::types::{TunnelConfig, VpnError, VpnEvent};
use super::{parse_keys, parse_preshared_key, route};

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

    let preshared = parse_preshared_key(&config)?;

    if preshared.is_some() {
        log::info!("tunnel uses a preshared key");
    }

    let mut tunn = Tunn::new(static_private, server_public, preshared, keepalive, 0, None);

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

    let (address, prefix) = parse_cidr(&config.address)?;
    let gateway = tunnel_gateway(address, prefix);

    let _ = route::remove_default_route(TUNNEL_NAME, endpoint.ip());

    let dev = tun_rs::DeviceBuilder::new()
        .name(TUNNEL_NAME)
        .ipv4(address, prefix, None)
        .mtu(1420)
        .build_async()
        .map_err(|e| VpnError::Tun(e.to_string()))?;

    route::apply_default_route(TUNNEL_NAME, endpoint.ip(), std::net::IpAddr::V4(gateway))
        .map_err(|e| VpnError::Io(format!("route: {e}")))?;

    let mut tun_buf = vec![0u8; MAX_PACKET];
    let mut udp_buf = vec![0u8; MAX_PACKET];
    let mut timer = interval(Duration::from_millis(250));
    let mut connected = false;
    let mut ticks_without_handshake: u32 = 0;

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
                        }
                        TunnResult::Err(e) => {
                            log::warn!("decapsulate rejected a packet: {e:?}");
                        }
                        TunnResult::Done => {}
                    }
                    break;
                }
            }

            _ = timer.tick() => {
                if let TunnResult::WriteToNetwork(b) = tunn.update_timers(&mut work) {
                    let _ = socket.send(b).await;
                }

                if !connected {
                    ticks_without_handshake += 1;

                    if tunn.stats().0.is_some() {
                        connected = true;
                        log::info!("tunnel handshake complete");
                        emit(VpnEvent::Connected { assigned_ip: config.address.clone() });
                    } else if ticks_without_handshake % 20 == 0 {
                        let (_, tx, rx, _, _) = tunn.stats();
                        log::warn!(
                            "no handshake after {}s (tx {tx} B, rx {rx} B) — check UDP 51820 to {endpoint}",
                            ticks_without_handshake / 4
                        );
                    }
                }
            }
        }
    };

    let _ = route::remove_default_route(TUNNEL_NAME, endpoint.ip());
    emit(VpnEvent::Disconnected);
    result
}

fn parse_cidr(value: &str) -> Result<(std::net::Ipv4Addr, u8), VpnError> {
    let mut parts = value.split('/');
    let ip: std::net::Ipv4Addr = parts
        .next()
        .unwrap_or(value)
        .parse()
        .map_err(|_| VpnError::Endpoint(format!("bad address {value}")))?;

    let prefix = match parts.next() {
        Some(raw) => raw
            .parse::<u8>()
            .map_err(|_| VpnError::Endpoint(format!("bad prefix {value}")))?,
        None => 32,
    };

    if prefix > 32 {
        return Err(VpnError::Endpoint(format!("bad prefix {value}")));
    }

    Ok((ip, prefix))
}

fn tunnel_gateway(address: std::net::Ipv4Addr, prefix: u8) -> std::net::Ipv4Addr {
    if prefix >= 31 {
        return address;
    }

    let mask = u32::MAX << (32 - prefix);
    let network = u32::from(address) & mask;

    std::net::Ipv4Addr::from(network + 1)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_ipv4_from_cidr() {
        let (ip, prefix) = parse_cidr("10.8.0.2/32").unwrap();
        assert_eq!(ip, std::net::Ipv4Addr::new(10, 8, 0, 2));
        assert_eq!(prefix, 32);
    }

    #[test]
    fn keeps_the_prefix_from_the_server_config() {
        let (ip, prefix) = parse_cidr("10.8.0.3/24").unwrap();
        assert_eq!(ip, std::net::Ipv4Addr::new(10, 8, 0, 3));
        assert_eq!(prefix, 24, "a /32 mask leaves no route to the tunnel peer");
    }

    #[test]
    fn parses_ipv4_without_prefix() {
        let (ip, prefix) = parse_cidr("10.8.0.2").unwrap();
        assert_eq!(ip, std::net::Ipv4Addr::new(10, 8, 0, 2));
        assert_eq!(prefix, 32);
    }

    #[test]
    fn rejects_out_of_range_prefix() {
        assert!(matches!(parse_cidr("10.8.0.2/33"), Err(VpnError::Endpoint(_))));
    }

    #[test]
    fn gateway_is_the_first_host_of_the_tunnel_subnet() {
        let gateway = tunnel_gateway(std::net::Ipv4Addr::new(10, 8, 0, 3), 24);
        assert_eq!(gateway, std::net::Ipv4Addr::new(10, 8, 0, 1));
    }

    #[test]
    fn gateway_falls_back_to_self_on_point_to_point() {
        let address = std::net::Ipv4Addr::new(10, 8, 0, 3);
        assert_eq!(tunnel_gateway(address, 32), address);
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
