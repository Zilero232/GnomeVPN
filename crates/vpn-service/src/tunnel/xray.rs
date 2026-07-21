use std::net::{Ipv4Addr, SocketAddr, SocketAddrV4, TcpListener};
use std::path::PathBuf;
use std::process::Stdio;

use gnomevpn_ipc::TunnelConfig;
use tokio::process::{Child, Command};

use super::TunnelError;

const BINARY: &str = if cfg!(target_os = "windows") {
    "xray.exe"
} else {
    "xray"
};

const CONFIG_NAME: &str = "xray-config.json";

pub struct Xray {
    child: Child,
    socks: SocketAddr,
    config_path: PathBuf,
}

impl Xray {
    pub fn socks_addr(&self) -> SocketAddr {
        self.socks
    }

    pub async fn stop(mut self) {
        let _ = self.child.kill().await;
        let _ = tokio::fs::remove_file(&self.config_path).await;
    }

    pub fn has_exited(&mut self) -> Option<String> {
        match self.child.try_wait() {
            Ok(Some(status)) => Some(format!("xray exited with {status}")),
            Ok(None) => None,
            Err(error) => Some(format!("xray status unavailable: {error}")),
        }
    }
}

fn binary_path() -> Result<PathBuf, TunnelError> {
    let base = std::env::current_exe()
        .map_err(|error| TunnelError::Xray(error.to_string()))?
        .parent()
        .ok_or_else(|| TunnelError::Xray("service has no parent directory".into()))?
        .to_path_buf();

    let path = base.join(BINARY);

    if !path.exists() {
        return Err(TunnelError::Xray(format!(
            "{BINARY} not found next to the service at {}",
            base.display()
        )));
    }

    Ok(path)
}

fn config_dir() -> Result<PathBuf, TunnelError> {
    #[cfg(target_os = "windows")]
    let base = PathBuf::from(
        std::env::var("ProgramData").unwrap_or_else(|_| r"C:\ProgramData".to_string()),
    )
    .join("GnomeVPN");

    #[cfg(not(target_os = "windows"))]
    let base = PathBuf::from("/var/lib/gnomevpn");

    std::fs::create_dir_all(&base)
        .map_err(|error| TunnelError::Xray(format!("cannot create {}: {error}", base.display())))?;

    Ok(base)
}

fn free_loopback_port() -> Result<u16, TunnelError> {
    let listener = TcpListener::bind(SocketAddrV4::new(Ipv4Addr::LOCALHOST, 0))
        .map_err(|error| TunnelError::Xray(error.to_string()))?;

    listener
        .local_addr()
        .map(|addr| addr.port())
        .map_err(|error| TunnelError::Xray(error.to_string()))
}

pub use gnomevpn_ipc::SocksCredentials as Credentials;

pub async fn spawn(config: &TunnelConfig) -> Result<(Xray, Credentials), TunnelError> {
    let binary = binary_path()?;

    let socks = SocketAddr::from((Ipv4Addr::LOCALHOST, free_loopback_port()?));
    let credentials = Credentials::generate()
        .map_err(|error| TunnelError::Xray(format!("no randomness available: {error}")))?;

    let config_path = config_dir()?.join(CONFIG_NAME);

    tokio::fs::write(
        &config_path,
        gnomevpn_ipc::build_xray_config(config, socks, &credentials),
    )
    .await
    .map_err(|error| TunnelError::Xray(format!("cannot write the xray config: {error}")))?;

    let child = Command::new(&binary)
        .arg("run")
        .arg("-c")
        .arg(&config_path)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .kill_on_drop(true)
        .spawn()
        .map_err(|error| TunnelError::Xray(format!("cannot start {BINARY}: {error}")))?;

    Ok((
        Xray {
            child,
            socks,
            config_path,
        },
        credentials,
    ))
}
