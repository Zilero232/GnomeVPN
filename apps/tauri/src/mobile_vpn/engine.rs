use std::net::{Ipv4Addr, SocketAddr, SocketAddrV4, TcpListener};
use std::path::{Path, PathBuf};
use std::process::Stdio;

use gnomevpn_ipc::{build_hysteria_config, SocksCredentials, TunnelConfig};
use tokio::process::{Child, Command};
use tokio::time::{interval, timeout, Duration};
use tun2proxy::{ArgDns, ArgProxy, Args, CancellationToken, ProxyType, UserKey};

use super::MobileVpnError;

const MTU: u16 = 1420;
const BINARY_NAME: &str = "libhysteria.so";
const CONFIG_NAME: &str = "hysteria-config.yaml";
const LOG_NAME: &str = "hysteria.log";
const TUN_ADDRESS: &str = "10.8.0.2";
const READY_TIMEOUT: Duration = Duration::from_secs(15);
const READY_INTERVAL: Duration = Duration::from_millis(200);
const LIVENESS_INTERVAL: Duration = Duration::from_secs(2);
const RECONNECT_MIN_DELAY: Duration = Duration::from_secs(1);
const RECONNECT_MAX_DELAY: Duration = Duration::from_secs(30);

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

pub fn assigned_ip() -> &'static str {
    TUN_ADDRESS
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

    let log = std::fs::File::create(dir.join(LOG_NAME)).map_err(|error| {
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

async fn watch_hysteria(
    hysteria: &mut Hysteria,
    cancellation: CancellationToken,
) -> MobileVpnError {
    let mut ticker = interval(LIVENESS_INTERVAL);

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
            }
        }
    }
}

async fn run_attempt(
    native_lib_dir: &Path,
    data_dir: &Path,
    config: &TunnelConfig,
    fd: i32,
    cancellation: CancellationToken,
) -> Result<(), MobileVpnError> {
    let (mut hysteria, credentials) = spawn_hysteria(native_lib_dir, data_dir, config).await?;
    let args = proxy_args(hysteria.socks_addr(), &credentials, &config.dns);

    let result = tokio::select! {
        tunnel = run_tun2proxy(args, fd, cancellation.clone()) => tunnel,
        reason = watch_hysteria(&mut hysteria, cancellation.clone()) => Err(reason),
    };

    hysteria.stop().await;

    result
}

pub async fn run_tunnel(
    native_lib_dir: &Path,
    data_dir: &Path,
    config: &TunnelConfig,
    fd: i32,
    cancellation: CancellationToken,
) -> Result<(), MobileVpnError> {
    let mut delay = RECONNECT_MIN_DELAY;

    loop {
        if cancellation.is_cancelled() {
            return Ok(());
        }

        let attempt = cancellation.child_token();

        match run_attempt(native_lib_dir, data_dir, config, fd, attempt).await {
            Ok(()) => delay = RECONNECT_MIN_DELAY,
            Err(error) => log::warn!("mobile tunnel attempt failed, reconnecting: {error}"),
        }

        if cancellation.is_cancelled() {
            return Ok(());
        }

        tokio::select! {
            _ = cancellation.cancelled() => return Ok(()),
            _ = tokio::time::sleep(delay) => {}
        }

        delay = (delay * 2).min(RECONNECT_MAX_DELAY);
    }
}
