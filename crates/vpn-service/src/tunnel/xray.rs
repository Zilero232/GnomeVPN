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

const LOG_NAME: &str = "xray.log";

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

// A service that dies without unwinding leaves its xray child behind, and that
// orphan keeps the socks port. The next tunnel then starts an xray that cannot
// bind, tun2proxy forwards into a port nobody answers, and every connection is
// reset while the tunnel looks up. The service owns every xray on the machine,
// so anything still running here is a leftover.
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

    reap_orphans().await;

    let config_path = config_dir()?.join(CONFIG_NAME);

    tokio::fs::write(
        &config_path,
        gnomevpn_ipc::build_xray_config(config, socks, &credentials),
    )
    .await
    .map_err(|error| TunnelError::Xray(format!("cannot write the xray config: {error}")))?;

    // Discarding the output leaves an exit code as the only clue when xray
    // refuses to start, and the reason it prints is the whole diagnosis.
    let log = log_file(&config_path).await;

    let child = Command::new(&binary)
        .arg("run")
        .arg("-c")
        .arg(&config_path)
        .stdin(Stdio::null())
        .stdout(log.0)
        .stderr(log.1)
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
