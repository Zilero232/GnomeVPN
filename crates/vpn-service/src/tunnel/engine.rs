use std::net::ToSocketAddrs;
use std::sync::Arc;

use boringtun::noise::{Tunn, TunnResult};
use tokio::net::UdpSocket;
use tokio::sync::oneshot;
use tokio::time::{interval, Duration};

use base64::{engine::general_purpose::STANDARD, Engine};
use gnomevpn_ipc::{TunnelConfig, TunnelEvent};
use x25519_dalek::{PublicKey, StaticSecret};

use super::route;
use super::TunnelError;

const MAX_PACKET: usize = 65535;
const TUNNEL_NAME: &str = "gnomevpn0";
const TICKS_PER_SECOND: u32 = 4;

pub async fn run_tunnel(
    config: TunnelConfig,
    emit: Arc<dyn Fn(TunnelEvent) + Send + Sync>,
    mut stop: oneshot::Receiver<()>,
) -> Result<(), TunnelError> {
    emit(TunnelEvent::Connecting);

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
        .map_err(|e| TunnelError::Endpoint(e.to_string()))?
        .next()
        .ok_or_else(|| TunnelError::Endpoint("no address".into()))?;

    let socket = UdpSocket::bind("0.0.0.0:0")
        .await
        .map_err(|e| TunnelError::Io(e.to_string()))?;
    socket
        .connect(endpoint)
        .await
        .map_err(|e| TunnelError::Io(e.to_string()))?;

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
        .map_err(|e| TunnelError::Tun(e.to_string()))?;

    route::apply_default_route(TUNNEL_NAME, endpoint.ip(), std::net::IpAddr::V4(gateway))
        .map_err(|e| TunnelError::Io(format!("route: {e}")))?;

    let mut tun_buf = vec![0u8; MAX_PACKET];
    let mut udp_buf = vec![0u8; MAX_PACKET];
    let mut timer = interval(Duration::from_millis(250));
    let mut connected = false;
    let mut ticks_without_handshake: u32 = 0;
    let mut ticks: u32 = 0;

    let result = loop {
        tokio::select! {
            _ = &mut stop => break Ok(()),

            r = dev.recv(&mut tun_buf) => {
                let n = match r {
                    Ok(n) => n,
                    Err(e) => break Err(TunnelError::Tun(e.to_string())),
                };
                match tunn.encapsulate(&tun_buf[..n], &mut work) {
                    TunnResult::WriteToNetwork(b) => { let _ = socket.send(b).await; }
                    TunnResult::Err(e) => break Err(TunnelError::Io(format!("encap: {e:?}"))),
                    _ => {}
                }
            }

            r = socket.recv(&mut udp_buf) => {
                let n = match r {
                    Ok(n) => n,
                    Err(e) => break Err(TunnelError::Io(e.to_string())),
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
                        emit(TunnelEvent::Connected { assigned_ip: config.address.clone() });
                    } else if ticks_without_handshake.is_multiple_of(20) {
                        let (_, tx, rx, _, _) = tunn.stats();
                        log::warn!(
                            "no handshake after {}s (tx {tx} B, rx {rx} B) — check UDP 51820 to {endpoint}",
                            ticks_without_handshake / 4
                        );
                    }
                }

                ticks += 1;

                if connected && ticks.is_multiple_of(TICKS_PER_SECOND) {
                    let (_, tx, rx, _, _) = tunn.stats();

                    emit(TunnelEvent::BytesUpdate { rx: rx as u64, tx: tx as u64 });
                }
            }
        }
    };

    let _ = route::remove_default_route(TUNNEL_NAME, endpoint.ip());
    emit(TunnelEvent::Disconnected);
    result
}

fn parse_cidr(value: &str) -> Result<(std::net::Ipv4Addr, u8), TunnelError> {
    let mut parts = value.split('/');
    let ip: std::net::Ipv4Addr = parts
        .next()
        .unwrap_or(value)
        .parse()
        .map_err(|_| TunnelError::Endpoint(format!("bad address {value}")))?;

    let prefix = match parts.next() {
        Some(raw) => raw
            .parse::<u8>()
            .map_err(|_| TunnelError::Endpoint(format!("bad prefix {value}")))?,
        None => 32,
    };

    if prefix > 32 {
        return Err(TunnelError::Endpoint(format!("bad prefix {value}")));
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

pub fn parse_keys(config: &TunnelConfig) -> Result<(StaticSecret, PublicKey), TunnelError> {
    let priv_bytes = decode_key(&config.private_key)?;
    let pub_bytes = decode_key(&config.server_public_key)?;

    Ok((StaticSecret::from(priv_bytes), PublicKey::from(pub_bytes)))
}

pub fn parse_preshared_key(config: &TunnelConfig) -> Result<Option<[u8; 32]>, TunnelError> {
    match config.preshared_key.as_deref() {
        Some(value) if !value.trim().is_empty() => Ok(Some(decode_key(value)?)),
        _ => Ok(None),
    }
}

fn decode_key(value: &str) -> Result<[u8; 32], TunnelError> {
    let raw = STANDARD
        .decode(value.trim())
        .map_err(|e| TunnelError::KeyDecode(e.to_string()))?;

    raw.try_into().map_err(|_| TunnelError::KeyLength)
}
