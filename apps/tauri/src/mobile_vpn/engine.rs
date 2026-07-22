use std::net::{Ipv4Addr, SocketAddr, SocketAddrV4, TcpListener};
use std::path::PathBuf;
use std::process::Stdio;

use gnomevpn_ipc::{build_xray_config, SocksCredentials, TunnelConfig};
use tauri::{AppHandle, Manager, Runtime};
use tokio::process::{Child, Command};
use tokio::time::{interval, timeout, Duration};
use tun2proxy::{ArgDns, ArgProxy, Args, CancellationToken, ProxyType, UserKey};

use super::plugin::VpnPlugin;
use super::MobileVpnError;

const MTU: u16 = 1420;
const BINARY_NAME: &str = "libxray.so";
const CONFIG_NAME: &str = "xray-config.json";
const LOG_NAME: &str = "xray.log";
const READY_TIMEOUT: Duration = Duration::from_secs(15);
const READY_INTERVAL: Duration = Duration::from_millis(200);

// Android only executes files from the app's native library directory, so the
// xray binary ships as libxray.so in jniLibs rather than as an asset.
fn binary_path<R: Runtime>(app: &AppHandle<R>) -> Result<PathBuf, MobileVpnError> {
    let path = app
        .state::<VpnPlugin<R>>()
        .native_library_dir()?
        .join(BINARY_NAME);

    if !path.exists() {
        return Err(MobileVpnError::Xray(format!(
            "{BINARY_NAME} not found at {}",
            path.display()
        )));
    }

    Ok(path)
}

fn free_loopback_port() -> Result<u16, MobileVpnError> {
    let listener = TcpListener::bind(SocketAddrV4::new(Ipv4Addr::LOCALHOST, 0))
        .map_err(|error| MobileVpnError::Xray(error.to_string()))?;

    listener
        .local_addr()
        .map(|addr| addr.port())
        .map_err(|error| MobileVpnError::Xray(error.to_string()))
}

pub struct Xray {
    child: Child,
    socks: SocketAddr,
}

impl Xray {
    pub fn socks_addr(&self) -> SocketAddr {
        self.socks
    }

    pub fn has_exited(&mut self) -> Option<String> {
        match self.child.try_wait() {
            Ok(Some(status)) => Some(format!("xray exited with {status}")),
            Ok(None) => None,
            Err(error) => Some(format!("xray status unavailable: {error}")),
        }
    }

    pub async fn stop(mut self) {
        let _ = self.child.kill().await;
    }
}

pub async fn spawn_xray<R: Runtime>(
    app: &AppHandle<R>,
    config: &TunnelConfig,
) -> Result<(Xray, SocksCredentials), MobileVpnError> {
    let binary = binary_path(app)?;

    let socks = SocketAddr::from((Ipv4Addr::LOCALHOST, free_loopback_port()?));
    let credentials = SocksCredentials::generate()
        .map_err(|error| MobileVpnError::Xray(format!("no randomness available: {error}")))?;

    let dir = app
        .path()
        .app_data_dir()
        .map_err(|error| MobileVpnError::Xray(error.to_string()))?;

    tokio::fs::create_dir_all(&dir)
        .await
        .map_err(|error| MobileVpnError::Xray(error.to_string()))?;

    let config_path = dir.join(CONFIG_NAME);

    tokio::fs::write(&config_path, build_xray_config(config, socks, &credentials))
        .await
        .map_err(|error| MobileVpnError::Xray(format!("cannot write the xray config: {error}")))?;

    let log = std::fs::File::create(dir.join(LOG_NAME))
        .map_err(|error| MobileVpnError::Xray(format!("cannot open the xray log: {error}")))?;

    let errors = log
        .try_clone()
        .map_err(|error| MobileVpnError::Xray(error.to_string()))?;

    let child = Command::new(&binary)
        .arg("run")
        .arg("-c")
        .arg(&config_path)
        .stdout(Stdio::from(log))
        .stderr(Stdio::from(errors))
        .spawn()
        .map_err(|error| MobileVpnError::Xray(format!("cannot start xray: {error}")))?;

    let mut xray = Xray { child, socks };

    wait_until_ready(socks, &mut xray).await?;

    Ok((xray, credentials))
}

async fn wait_until_ready(socks: SocketAddr, xray: &mut Xray) -> Result<(), MobileVpnError> {
    let mut ticker = interval(READY_INTERVAL);

    let probe = async {
        loop {
            ticker.tick().await;

            if let Some(reason) = xray.has_exited() {
                return Err(MobileVpnError::Xray(reason));
            }

            if tokio::net::TcpStream::connect(socks).await.is_ok() {
                return Ok(());
            }
        }
    };

    timeout(READY_TIMEOUT, probe)
        .await
        .map_err(|_| MobileVpnError::Xray("xray did not open its inbound in time".into()))?
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
    // The descriptor belongs to the Kotlin ParcelFileDescriptor, which closes it
    // in teardown(). Closing it here too trips fdsan and aborts the process.
    args.tun_fd(Some(fd)).close_fd_on_drop(false);

    tun2proxy::general_run_async(args, MTU, false, cancellation)
        .await
        .map(|_| ())
        .map_err(|error| MobileVpnError::Tunnel(error.to_string()))
}
