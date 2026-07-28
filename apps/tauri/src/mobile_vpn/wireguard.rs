use std::net::SocketAddr;

use base64::engine::general_purpose::STANDARD;
use base64::Engine;
use boringtun::noise::errors::WireGuardError;
use boringtun::noise::{Tunn, TunnResult};
use boringtun::x25519::{PublicKey, StaticSecret};
use gnomevpn_ipc::{TunnelConfig, WireguardConfig};
use tokio::net::{lookup_host, UdpSocket};
use tokio::sync::Mutex;
use tokio::time::{interval, Duration};
use tun2proxy::CancellationToken;

use super::engine::Phase;
use super::MobileVpnError;

const KEEPALIVE_SECS: u16 = 25;
const TIMER_TICK: Duration = Duration::from_millis(250);
const HANDSHAKE_TIMEOUT: Duration = Duration::from_secs(20);
const UDP_BUFFER: usize = 1600;
const TUN_BUFFER: usize = 1600;
const RESERVED_OFFSET: usize = 1;
const RESERVED_LEN: usize = 3;
const RESERVED_END: usize = RESERVED_OFFSET + RESERVED_LEN;

struct WireguardKeys {
    private: StaticSecret,
    peer_public: PublicKey,
    preshared: Option<[u8; 32]>,
}

fn decode_key(field: &str, value: &str) -> Result<[u8; 32], MobileVpnError> {
    let bytes = STANDARD
        .decode(value.trim())
        .map_err(|error| MobileVpnError::Wireguard(format!("{field}: not base64: {error}")))?;

    bytes
        .try_into()
        .map_err(|_| MobileVpnError::Wireguard(format!("{field}: must be 32 bytes")))
}

fn keys_from_config(wireguard: &WireguardConfig) -> Result<WireguardKeys, MobileVpnError> {
    let private = StaticSecret::from(decode_key("privateKey", &wireguard.private_key)?);
    let peer_public = PublicKey::from(decode_key("peerPublicKey", &wireguard.peer_public_key)?);

    let preshared = match &wireguard.pre_shared_key {
        Some(value) => Some(decode_key("preSharedKey", value)?),
        None => None,
    };

    Ok(WireguardKeys {
        private,
        peer_public,
        preshared,
    })
}

pub fn assigned_ip(wireguard: &WireguardConfig) -> String {
    wireguard
        .address
        .split('/')
        .next()
        .unwrap_or(&wireguard.address)
        .to_string()
}

async fn resolve_endpoint(config: &TunnelConfig) -> Result<SocketAddr, MobileVpnError> {
    let host = format!("{}:{}", config.server, config.port);

    let resolved = lookup_host(&host)
        .await
        .map_err(|error| MobileVpnError::Wireguard(format!("cannot resolve {host}: {error}")))?
        .next();

    resolved.ok_or_else(|| MobileVpnError::Wireguard(format!("no address for {host}")))
}

fn apply_reserved(packet: &mut [u8], reserved: &[u8]) {
    if reserved.len() != RESERVED_LEN || packet.len() < RESERVED_END {
        return;
    }

    packet[RESERVED_OFFSET..RESERVED_END].copy_from_slice(reserved);
}

fn strip_reserved(packet: &mut [u8], reserved: &[u8]) {
    if reserved.len() != RESERVED_LEN || packet.len() < RESERVED_END {
        return;
    }

    packet[RESERVED_OFFSET..RESERVED_END].fill(0);
}

async fn send_to_network(
    socket: &UdpSocket,
    packet: &mut [u8],
    reserved: &[u8],
) -> Result<(), MobileVpnError> {
    apply_reserved(packet, reserved);

    socket
        .send(packet)
        .await
        .map(|_| ())
        .map_err(|error| MobileVpnError::Wireguard(format!("udp send failed: {error}")))
}

async fn drain_network(
    tunnel: &Mutex<Tunn>,
    socket: &UdpSocket,
    reserved: &[u8],
) -> Result<(), MobileVpnError> {
    loop {
        let mut scratch = [0u8; UDP_BUFFER];

        let outcome = {
            let mut guard = tunnel.lock().await;

            match guard.decapsulate(None, &[], &mut scratch) {
                TunnResult::WriteToNetwork(packet) => Some(packet.len()),
                _ => None,
            }
        };

        match outcome {
            Some(len) => send_to_network(socket, &mut scratch[..len], reserved).await?,
            None => return Ok(()),
        }
    }
}

async fn handle_tun_packet(
    tunnel: &Mutex<Tunn>,
    socket: &UdpSocket,
    reserved: &[u8],
    packet: &[u8],
) -> Result<(), MobileVpnError> {
    let mut scratch = [0u8; UDP_BUFFER];

    let outcome = {
        let mut guard = tunnel.lock().await;

        match guard.encapsulate(packet, &mut scratch) {
            TunnResult::WriteToNetwork(out) => Ok(Some(out.len())),
            TunnResult::Done => Ok(None),
            TunnResult::Err(error) => Err(wireguard_error(error)),
            _ => Ok(None),
        }
    }?;

    if let Some(len) = outcome {
        send_to_network(socket, &mut scratch[..len], reserved).await?;
    }

    Ok(())
}

async fn handle_udp_packet(
    tunnel: &Mutex<Tunn>,
    socket: &UdpSocket,
    device: &AsyncTun,
    reserved: &[u8],
    datagram: &mut [u8],
) -> Result<(), MobileVpnError> {
    strip_reserved(datagram, reserved);

    let mut scratch = [0u8; TUN_BUFFER];

    let write = {
        let mut guard = tunnel.lock().await;

        match guard.decapsulate(None, datagram, &mut scratch) {
            TunnResult::WriteToNetwork(packet) => Written::Network(packet.len()),
            TunnResult::WriteToTunnelV4(packet, _) => Written::Tunnel(packet.len()),
            TunnResult::WriteToTunnelV6(packet, _) => Written::Tunnel(packet.len()),
            TunnResult::Done => Written::None,
            TunnResult::Err(error) => return Err(wireguard_error(error)),
        }
    };

    match write {
        Written::Network(len) => {
            send_to_network(socket, &mut scratch[..len], reserved).await?;
            drain_network(tunnel, socket, reserved).await?;
        }
        Written::Tunnel(len) => device.write_packet(&scratch[..len]).await?,
        Written::None => {}
    }

    Ok(())
}

async fn tick_timers(
    tunnel: &Mutex<Tunn>,
    socket: &UdpSocket,
    reserved: &[u8],
) -> Result<(), MobileVpnError> {
    let mut scratch = [0u8; UDP_BUFFER];

    let outcome = {
        let mut guard = tunnel.lock().await;

        match guard.update_timers(&mut scratch) {
            TunnResult::WriteToNetwork(packet) => Some(packet.len()),
            TunnResult::Err(WireGuardError::ConnectionExpired) => {
                return Err(MobileVpnError::Wireguard("handshake expired".into()))
            }
            _ => None,
        }
    };

    if let Some(len) = outcome {
        send_to_network(socket, &mut scratch[..len], reserved).await?;
    }

    Ok(())
}

async fn initiate_handshake(
    tunnel: &Mutex<Tunn>,
    socket: &UdpSocket,
    reserved: &[u8],
) -> Result<(), MobileVpnError> {
    let mut scratch = [0u8; UDP_BUFFER];

    let outcome = {
        let mut guard = tunnel.lock().await;

        match guard.encapsulate(&[], &mut scratch) {
            TunnResult::WriteToNetwork(packet) => Some(packet.len()),
            TunnResult::Err(error) => return Err(wireguard_error(error)),
            _ => None,
        }
    };

    if let Some(len) = outcome {
        send_to_network(socket, &mut scratch[..len], reserved).await?;
    }

    Ok(())
}

fn handshake_complete(tunnel: &Tunn) -> bool {
    tunnel.stats().0.is_some()
}

enum Written {
    Network(usize),
    Tunnel(usize),
    None,
}

fn wireguard_error(error: WireGuardError) -> MobileVpnError {
    MobileVpnError::Wireguard(format!("{error:?}"))
}

struct AsyncTun {
    device: tun::AsyncDevice,
}

impl AsyncTun {
    async fn read_packet(&self, buffer: &mut [u8]) -> Result<usize, MobileVpnError> {
        self.device
            .recv(buffer)
            .await
            .map_err(|error| MobileVpnError::Wireguard(format!("tun read failed: {error}")))
    }

    async fn write_packet(&self, packet: &[u8]) -> Result<(), MobileVpnError> {
        self.device
            .send(packet)
            .await
            .map(|_| ())
            .map_err(|error| MobileVpnError::Wireguard(format!("tun write failed: {error}")))
    }
}

fn open_device(fd: i32) -> Result<AsyncTun, MobileVpnError> {
    let mut config = tun::Configuration::default();

    config.raw_fd(fd).close_fd_on_drop(false);

    let device = tun::create_as_async(&config)
        .map_err(|error| MobileVpnError::Wireguard(format!("cannot wrap the tun fd: {error}")))?;

    Ok(AsyncTun { device })
}

pub async fn run_wireguard<F>(
    config: &TunnelConfig,
    fd: i32,
    cancellation: CancellationToken,
    on_phase: &mut F,
) -> Result<(), MobileVpnError>
where
    F: FnMut(Phase) + Send,
{
    let wireguard = config
        .wireguard
        .as_ref()
        .ok_or_else(|| MobileVpnError::Wireguard("missing the wireguard config".into()))?;

    let keys = keys_from_config(wireguard)?;
    let reserved = wireguard.reserved.clone();
    let endpoint = resolve_endpoint(config).await?;

    let tunnel = Tunn::new(
        keys.private,
        keys.peer_public,
        keys.preshared,
        Some(KEEPALIVE_SECS),
        0,
        None,
    );
    let tunnel = Mutex::new(tunnel);

    let bind: SocketAddr = match endpoint {
        SocketAddr::V4(_) => "0.0.0.0:0".parse(),
        SocketAddr::V6(_) => "[::]:0".parse(),
    }
    .map_err(|error| MobileVpnError::Wireguard(format!("bad bind address: {error}")))?;

    let socket = UdpSocket::bind(bind)
        .await
        .map_err(|error| MobileVpnError::Wireguard(format!("cannot open a udp socket: {error}")))?;

    socket
        .connect(endpoint)
        .await
        .map_err(|error| MobileVpnError::Wireguard(format!("cannot reach {endpoint}: {error}")))?;

    let device = open_device(fd)?;

    on_phase(Phase::Connecting);
    initiate_handshake(&tunnel, &socket, &reserved).await?;

    let mut timer = interval(TIMER_TICK);
    let mut connected = false;
    let mut waited = Duration::ZERO;
    let mut tun_buffer = [0u8; TUN_BUFFER];
    let mut udp_buffer = [0u8; UDP_BUFFER];

    loop {
        tokio::select! {
            _ = cancellation.cancelled() => return Ok(()),
            _ = timer.tick() => {
                tick_timers(&tunnel, &socket, &reserved).await?;

                if !connected {
                    waited += TIMER_TICK;

                    if waited >= HANDSHAKE_TIMEOUT {
                        return Err(MobileVpnError::Wireguard(
                            "no handshake within the timeout".into(),
                        ));
                    }
                }
            }
            read = device.read_packet(&mut tun_buffer) => {
                let len = read?;

                if len > 0 {
                    handle_tun_packet(&tunnel, &socket, &reserved, &tun_buffer[..len]).await?;
                }
            }
            received = socket.recv(&mut udp_buffer) => {
                let len = received.map_err(|error| {
                    MobileVpnError::Wireguard(format!("udp recv failed: {error}"))
                })?;

                if len > 0 {
                    handle_udp_packet(
                        &tunnel,
                        &socket,
                        &device,
                        &reserved,
                        &mut udp_buffer[..len],
                    )
                    .await?;
                }
            }
        }

        if !connected && handshake_complete(&*tunnel.lock().await) {
            connected = true;
            on_phase(Phase::Connected);
        }
    }
}
