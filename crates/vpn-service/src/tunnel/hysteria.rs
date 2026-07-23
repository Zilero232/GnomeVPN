use std::net::{Ipv4Addr, SocketAddr, SocketAddrV4, TcpListener};
use std::path::PathBuf;
use std::process::Stdio;

use gnomevpn_ipc::TunnelConfig;
use tokio::process::{Child, Command};

use super::TunnelError;

const BINARY: &str = if cfg!(target_os = "windows") {
    "hysteria.exe"
} else {
    "hysteria"
};

const CONFIG_NAME: &str = "hysteria-config.yaml";

const LOG_NAME: &str = "hysteria.log";

pub struct Hysteria {
    child: Child,
    socks: SocketAddr,
    config_path: PathBuf,
}

impl Hysteria {
    pub fn socks_addr(&self) -> SocketAddr {
        self.socks
    }

    pub async fn stop(mut self) {
        let _ = self.child.kill().await;
        let _ = tokio::fs::remove_file(&self.config_path).await;
    }

    pub fn has_exited(&mut self) -> Option<String> {
        match self.child.try_wait() {
            Ok(Some(status)) => Some(format!("hysteria exited with {status}")),
            Ok(None) => None,
            Err(error) => Some(format!("hysteria status unavailable: {error}")),
        }
    }
}

async fn reap_orphans() {
    #[cfg(target_os = "windows")]
    let mut command = {
        let mut command = Command::new("taskkill.exe");
        command.args(["/F", "/IM", BINARY]);
        command
    };

    #[cfg(not(target_os = "windows"))]
    let mut command = {
        let mut command = Command::new("pkill");
        command.args(["-f", BINARY]);
        command
    };

    let _ = command
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .await;
}

async fn log_file(config_path: &std::path::Path) -> (Stdio, Stdio) {
    let Some(dir) = config_path.parent() else {
        return (Stdio::null(), Stdio::null());
    };

    let Ok(file) = std::fs::File::create(dir.join(LOG_NAME)) else {
        return (Stdio::null(), Stdio::null());
    };

    let Ok(errors) = file.try_clone() else {
        return (Stdio::null(), Stdio::null());
    };

    (Stdio::from(file), Stdio::from(errors))
}

fn binary_path() -> Result<PathBuf, TunnelError> {
    let base = std::env::current_exe()
        .map_err(|error| TunnelError::Hysteria(error.to_string()))?
        .parent()
        .ok_or_else(|| TunnelError::Hysteria("service has no parent directory".into()))?
        .to_path_buf();

    let path = base.join(BINARY);

    if !path.exists() {
        return Err(TunnelError::Hysteria(format!(
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

    std::fs::create_dir_all(&base).map_err(|error| {
        TunnelError::Hysteria(format!("cannot create {}: {error}", base.display()))
    })?;

    Ok(base)
}

fn free_loopback_port() -> Result<u16, TunnelError> {
    let listener = TcpListener::bind(SocketAddrV4::new(Ipv4Addr::LOCALHOST, 0))
        .map_err(|error| TunnelError::Hysteria(error.to_string()))?;

    listener
        .local_addr()
        .map(|addr| addr.port())
        .map_err(|error| TunnelError::Hysteria(error.to_string()))
}

pub use gnomevpn_ipc::SocksCredentials as Credentials;

pub async fn spawn(config: &TunnelConfig) -> Result<(Hysteria, Credentials), TunnelError> {
    let binary = binary_path()?;

    let socks = SocketAddr::from((Ipv4Addr::LOCALHOST, free_loopback_port()?));
    let credentials = Credentials::generate()
        .map_err(|error| TunnelError::Hysteria(format!("no randomness available: {error}")))?;

    reap_orphans().await;

    let config_path = config_dir()?.join(CONFIG_NAME);

    tokio::fs::write(
        &config_path,
        gnomevpn_ipc::build_hysteria_config(config, socks, &credentials),
    )
    .await
    .map_err(|error| TunnelError::Hysteria(format!("cannot write the hysteria config: {error}")))?;

    log::info!(
        "wrote hysteria config to {}; hysteria log goes to {}",
        config_path.display(),
        config_path
            .parent()
            .map(|dir| dir.join(LOG_NAME))
            .unwrap_or_else(|| PathBuf::from(LOG_NAME))
            .display()
    );

    let log = log_file(&config_path).await;

    let child = Command::new(&binary)
        .arg("client")
        .arg("-c")
        .arg(&config_path)
        .stdin(Stdio::null())
        .stdout(log.0)
        .stderr(log.1)
        .kill_on_drop(true)
        .spawn()
        .map_err(|error| TunnelError::Hysteria(format!("cannot start {BINARY}: {error}")))?;

    Ok((
        Hysteria {
            child,
            socks,
            config_path,
        },
        credentials,
    ))
}
