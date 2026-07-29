use std::net::{Ipv4Addr, SocketAddr, SocketAddrV4, TcpListener};
use std::path::{Path, PathBuf};
use std::process::Stdio;
use std::sync::Mutex;

use gnomevpn_ipc::{build_hysteria_config, SocksCredentials, TunnelConfig, TunnelProtocol};
use tokio::process::{Child, Command};
use tokio::time::{interval, timeout, Duration};
use tun2proxy::{ArgDns, ArgProxy, Args, CancellationToken, ProxyType, UserKey};

use super::wireguard;
use super::{counters, MobileVpnError};

const MTU: u16 = 1420;
const BINARY_NAME: &str = "libhysteria.so";
const CONFIG_NAME: &str = "hysteria-config.yaml";
const LOG_NAME: &str = "hysteria.log";
const TUN_ADDRESS: &str = "10.8.0.2";
const READY_TIMEOUT: Duration = Duration::from_secs(15);
const READY_INTERVAL: Duration = Duration::from_millis(200);
const LIVENESS_INTERVAL: Duration = Duration::from_secs(2);
const LOG_MAX_BYTES: u64 = 2 * 1024 * 1024;
const RECONNECT_MIN_DELAY: Duration = Duration::from_secs(1);
const RECONNECT_MAX_DELAY: Duration = Duration::from_secs(30);
const STALL_TIMEOUT: Duration = Duration::from_secs(60);
const STALL_MIN_BYTES: u64 = 32 * 1024;

static ATTEMPT: Mutex<Option<CancellationToken>> = Mutex::new(None);

fn arm_attempt(token: &CancellationToken) {
    if let Ok(mut guard) = ATTEMPT.lock() {
        *guard = Some(token.clone());
    }
}

fn disarm_attempt() {
    if let Ok(mut guard) = ATTEMPT.lock() {
        *guard = None;
    }
}

pub fn restart_attempt() {
    let token = ATTEMPT.lock().ok().and_then(|guard| guard.clone());

    match token {
        Some(token) => token.cancel(),
        None => log::warn!("restart requested with no attempt running"),
    }
}

fn binary_path(native_lib_dir: &Path) -> Result<PathBuf, MobileVpnError> {
    let path = native_lib_dir.join(BINARY_NAME);

    if !path.exists() {
        return Err(MobileVpnError::Hysteria(format!(
            "{BINARY_NAME} not found at {}",
            path.display()
        )));
    }

    Ok(path)
}

pub fn assigned_ip(config: &TunnelConfig) -> String {
    match (config.protocol, config.wireguard.as_ref()) {
        (TunnelProtocol::Wireguard, Some(wireguard)) => wireguard::assigned_ip(wireguard),
        _ => TUN_ADDRESS.to_string(),
    }
}

fn free_loopback_port() -> Result<u16, MobileVpnError> {
    let listener = TcpListener::bind(SocketAddrV4::new(Ipv4Addr::LOCALHOST, 0))
        .map_err(|error| MobileVpnError::Hysteria(error.to_string()))?;

    listener
        .local_addr()
        .map(|addr| addr.port())
        .map_err(|error| MobileVpnError::Hysteria(error.to_string()))
}

pub struct Hysteria {
    child: Child,
    socks: SocketAddr,
}

impl Hysteria {
    pub fn socks_addr(&self) -> SocketAddr {
        self.socks
    }

    pub fn has_exited(&mut self) -> Option<String> {
        match self.child.try_wait() {
            Ok(Some(status)) => Some(format!("hysteria exited with {status}")),
            Ok(None) => None,
            Err(error) => Some(format!("hysteria status unavailable: {error}")),
        }
    }

    pub async fn stop(mut self) {
        let _ = self.child.kill().await;
    }
}

pub async fn spawn_hysteria(
    native_lib_dir: &Path,
    data_dir: &Path,
    config: &TunnelConfig,
) -> Result<(Hysteria, SocksCredentials), MobileVpnError> {
    let binary = binary_path(native_lib_dir)?;

    let socks = SocketAddr::from((Ipv4Addr::LOCALHOST, free_loopback_port()?));
    let credentials = SocksCredentials::generate()
        .map_err(|error| MobileVpnError::Hysteria(format!("no randomness available: {error}")))?;

    let dir = data_dir.to_path_buf();

    tokio::fs::create_dir_all(&dir)
        .await
        .map_err(|error| MobileVpnError::Hysteria(error.to_string()))?;

    let config_path = dir.join(CONFIG_NAME);

    tokio::fs::write(
        &config_path,
        build_hysteria_config(config, socks, &credentials),
    )
    .await
    .map_err(|error| {
        MobileVpnError::Hysteria(format!("cannot write the hysteria config: {error}"))
    })?;

    let log_path = dir.join(LOG_NAME);

    if tokio::fs::metadata(&log_path)
        .await
        .is_ok_and(|meta| meta.len() > LOG_MAX_BYTES)
    {
        let _ = tokio::fs::remove_file(&log_path).await;
    }

    let log = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path)
        .map_err(|error| {
            MobileVpnError::Hysteria(format!("cannot open the hysteria log: {error}"))
        })?;

    let errors = log
        .try_clone()
        .map_err(|error| MobileVpnError::Hysteria(error.to_string()))?;

    let child = Command::new(&binary)
        .arg("client")
        .arg("-c")
        .arg(&config_path)
        .stdout(Stdio::from(log))
        .stderr(Stdio::from(errors))
        .spawn()
        .map_err(|error| MobileVpnError::Hysteria(format!("cannot start hysteria: {error}")))?;

    let mut hysteria = Hysteria { child, socks };

    wait_until_ready(socks, &mut hysteria).await?;

    Ok((hysteria, credentials))
}

async fn wait_until_ready(
    socks: SocketAddr,
    hysteria: &mut Hysteria,
) -> Result<(), MobileVpnError> {
    let mut ticker = interval(READY_INTERVAL);

    let probe = async {
        loop {
            ticker.tick().await;

            if let Some(reason) = hysteria.has_exited() {
                return Err(MobileVpnError::Hysteria(reason));
            }

            if tokio::net::TcpStream::connect(socks).await.is_ok() {
                return Ok(());
            }
        }
    };

    timeout(READY_TIMEOUT, probe)
        .await
        .map_err(|_| MobileVpnError::Hysteria("hysteria did not open its inbound in time".into()))?
}

pub fn proxy_args(socks: SocketAddr, credentials: &SocksCredentials, dns: &[String]) -> Args {
    let mut args = Args::default();

    args.proxy(ArgProxy {
        proxy_type: ProxyType::Socks5,
        addr: socks,
        credentials: Some(UserKey::new(&credentials.user, &credentials.password)),
    })
    .setup(false)
    .dns(ArgDns::OverTcp);

    if let Some(server) = dns.iter().find_map(|entry| entry.parse().ok()) {
        args.dns_addr(server);
    }

    args
}

pub async fn run_tun2proxy(
    mut args: Args,
    fd: i32,
    cancellation: CancellationToken,
) -> Result<(), MobileVpnError> {
    args.tun_fd(Some(fd)).close_fd_on_drop(false);

    tun2proxy::general_run_async(args, MTU, false, cancellation)
        .await
        .map(|_| ())
        .map_err(|error| MobileVpnError::Tunnel(error.to_string()))
}

/// Decides whether the tunnel has gone deaf.
///
/// **Silence is not a fault.** A phone left alone sends nothing for minutes at a
/// time — measured at 145s of complete quiet on a healthy tunnel — and the QUIC
/// keepalive never crosses the TUN, because hysteria dials the node from outside
/// it. Tearing the tunnel down on idle would break exactly the case that must
/// keep working: the phone in a pocket overnight.
///
/// What does mean the session is dead is traffic going out with nothing coming
/// back: the apps are asking and the tunnel is swallowing it. Only sustained tx
/// against a completely flat rx counts.
#[derive(Default)]
struct StallDetector {
    last_seen: Option<counters::Traffic>,
    deaf_for: Duration,
    asked: u64,
}

impl StallDetector {
    fn observe(&mut self, current: counters::Traffic) -> Option<String> {
        let previous = self.last_seen.replace(current)?;

        if current.rx > previous.rx {
            self.deaf_for = Duration::ZERO;
            self.asked = 0;

            return None;
        }

        let sent = current.tx.saturating_sub(previous.tx);

        if sent == 0 {
            return None;
        }

        self.asked = self.asked.saturating_add(sent);
        self.deaf_for += LIVENESS_INTERVAL;

        if self.deaf_for < STALL_TIMEOUT || self.asked < STALL_MIN_BYTES {
            return None;
        }

        Some(format!(
            "sent {} bytes over {}s with no reply",
            self.asked,
            self.deaf_for.as_secs()
        ))
    }
}

/// Watches the tunnel for both ways it can die.
///
/// A crashed hysteria is the obvious one. The silent one is a live process whose
/// QUIC session is gone: `try_wait()` still reports it running, so nothing ever
/// triggers a reconnect and the app keeps claiming it is connected while nothing
/// loads. `StallDetector` covers that case.
///
/// Unreadable counters mean "cannot tell", never "stalled", so a tunnel is never
/// torn down on missing evidence.
async fn watch_hysteria(
    hysteria: &mut Hysteria,
    cancellation: CancellationToken,
) -> MobileVpnError {
    let mut ticker = interval(LIVENESS_INTERVAL);
    let mut detector = StallDetector::default();

    loop {
        tokio::select! {
            _ = cancellation.cancelled() => {
                return MobileVpnError::Hysteria("tunnel cancelled".into());
            }
            _ = ticker.tick() => {
                if let Some(reason) = hysteria.has_exited() {
                    cancellation.cancel();
                    return MobileVpnError::Hysteria(reason);
                }

                let Some(current) = counters::read() else {
                    continue;
                };

                if let Some(reason) = detector.observe(current) {
                    cancellation.cancel();
                    return MobileVpnError::Hysteria(reason);
                }
            }
        }
    }
}

async fn run_attempt<F>(
    native_lib_dir: &Path,
    data_dir: &Path,
    config: &TunnelConfig,
    fd: i32,
    cancellation: CancellationToken,
    on_phase: &mut F,
) -> Result<(), MobileVpnError>
where
    F: FnMut(Phase) + Send,
{
    match config.protocol {
        TunnelProtocol::Hysteria2 => {
            run_hysteria_attempt(native_lib_dir, data_dir, config, fd, cancellation, on_phase).await
        }
        TunnelProtocol::Wireguard => {
            wireguard::run_wireguard(config, fd, cancellation, on_phase).await
        }
    }
}

async fn run_hysteria_attempt<F>(
    native_lib_dir: &Path,
    data_dir: &Path,
    config: &TunnelConfig,
    fd: i32,
    cancellation: CancellationToken,
    on_phase: &mut F,
) -> Result<(), MobileVpnError>
where
    F: FnMut(Phase) + Send,
{
    let (mut hysteria, credentials) = spawn_hysteria(native_lib_dir, data_dir, config).await?;

    log::info!("hysteria is up, socks={}", hysteria.socks_addr());
    on_phase(Phase::Connected);

    let args = proxy_args(hysteria.socks_addr(), &credentials, &config.dns);

    let result = tokio::select! {
        tunnel = run_tun2proxy(args, fd, cancellation.clone()) => tunnel,
        reason = watch_hysteria(&mut hysteria, cancellation.clone()) => Err(reason),
    };

    hysteria.stop().await;

    result
}

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum Phase {
    Connecting,
    Connected,
}

#[derive(Clone, Copy)]
pub struct TunnelOptions {
    pub fd: i32,
    pub auto_reconnect: bool,
}

pub async fn run_tunnel<F>(
    native_lib_dir: &Path,
    data_dir: &Path,
    config: &TunnelConfig,
    options: TunnelOptions,
    cancellation: CancellationToken,
    mut on_phase: F,
) -> Result<(), MobileVpnError>
where
    F: FnMut(Phase) + Send,
{
    let fd = options.fd;
    let mut delay = RECONNECT_MIN_DELAY;
    let mut generation = 0u32;

    loop {
        if cancellation.is_cancelled() {
            return Ok(());
        }

        generation += 1;

        let attempt = cancellation.child_token();

        arm_attempt(&attempt);
        on_phase(Phase::Connecting);

        let outcome =
            run_attempt(native_lib_dir, data_dir, config, fd, attempt, &mut on_phase).await;

        disarm_attempt();

        if cancellation.is_cancelled() {
            return Ok(());
        }

        match outcome {
            Ok(()) => delay = RECONNECT_MIN_DELAY,
            Err(error) if options.auto_reconnect => {
                log::warn!("tunnel attempt #{generation} failed, retrying in {delay:?}: {error}")
            }
            Err(error) => {
                log::warn!("tunnel attempt #{generation} failed and auto-reconnect is off");

                return Err(error);
            }
        }

        tokio::select! {
            _ = cancellation.cancelled() => return Ok(()),
            _ = tokio::time::sleep(delay) => {}
        }

        delay = (delay * 2).min(RECONNECT_MAX_DELAY);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn feed(samples: impl IntoIterator<Item = (u64, u64)>) -> Option<String> {
        let mut detector = StallDetector::default();

        for (rx, tx) in samples {
            if let Some(reason) = detector.observe(counters::Traffic { rx, tx }) {
                return Some(reason);
            }
        }

        None
    }

    #[test]
    fn an_idle_phone_is_never_a_stall() {
        assert!(feed(std::iter::repeat_n((9_613_555, 2_246_843), 200)).is_none());
    }

    #[test]
    fn two_way_traffic_is_healthy() {
        let samples = (1..=200).map(|step| (9_613_232 + step * 540, 2_246_519 + step * 327));

        assert!(feed(samples).is_none());
    }

    #[test]
    fn sending_with_no_reply_is_a_stall() {
        let samples = (1..=200).map(|step| (9_613_232, 2_246_519 + step * 2_000));

        assert!(feed(samples).is_some());
    }

    #[test]
    fn a_trickle_alone_does_not_condemn_the_tunnel() {
        assert!(feed((1..=200).map(|step| (100, 100 + step * 10))).is_none());
    }

    #[test]
    fn a_single_reply_clears_the_count() {
        let one_way = (1..=20).map(|step| (100, 100 + step * 3_000));
        let recovered = (1..=100).map(|step| (100 + step * 3_000, 160_000 + step * 3_000));

        assert!(feed(one_way.chain(recovered)).is_none());
    }
}
