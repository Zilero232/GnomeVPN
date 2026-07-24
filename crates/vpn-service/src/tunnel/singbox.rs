use std::path::PathBuf;
use std::process::Stdio;

use gnomevpn_ipc::{build_singbox_config, SingboxConfigInput, TunnelConfig};
use tokio::process::{Child, Command};

use super::TunnelError;

const BINARY: &str = if cfg!(target_os = "windows") {
    "sing-box.exe"
} else {
    "sing-box"
};

const CONFIG_NAME: &str = "singbox-config.json";
const CACHE_NAME: &str = "singbox-cache.db";
const LOG_NAME: &str = "singbox.log";

pub struct Singbox {
    child: Child,
    config_path: PathBuf,
}

impl Singbox {
    pub async fn stop(mut self) {
        let _ = self.child.kill().await;
        let _ = tokio::fs::remove_file(&self.config_path).await;
    }

    pub fn has_exited(&mut self) -> Option<String> {
        match self.child.try_wait() {
            Ok(Some(status)) => Some(format!("sing-box exited with {status}")),
            Ok(None) => None,
            Err(error) => Some(format!("sing-box status unavailable: {error}")),
        }
    }
}

pub async fn reap_orphans() {
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

fn log_file(dir: &std::path::Path) -> (Stdio, Stdio) {
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
        .map_err(|error| TunnelError::Singbox(error.to_string()))?
        .parent()
        .ok_or_else(|| TunnelError::Singbox("service has no parent directory".into()))?
        .to_path_buf();

    let path = base.join(BINARY);

    if !path.exists() {
        return Err(TunnelError::Singbox(format!(
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
        TunnelError::Singbox(format!("cannot create {}: {error}", base.display()))
    })?;

    Ok(base)
}

pub struct SpawnInput<'a> {
    pub config: &'a TunnelConfig,
    pub split_apps: &'a [String],
}

pub async fn spawn(input: SpawnInput<'_>) -> Result<Singbox, TunnelError> {
    let SpawnInput { config, split_apps } = input;

    let binary = binary_path()?;
    let dir = config_dir()?;
    let config_path = dir.join(CONFIG_NAME);

    reap_orphans().await;

    tokio::fs::write(
        &config_path,
        build_singbox_config(SingboxConfigInput {
            config,
            split_apps,
            cache_path: &dir.join(CACHE_NAME).to_string_lossy(),
        }),
    )
    .await
    .map_err(|error| TunnelError::Singbox(format!("cannot write the sing-box config: {error}")))?;

    log::info!(
        "wrote sing-box config to {} ({} split rule(s)); sing-box log goes to {}",
        config_path.display(),
        split_apps.len(),
        dir.join(LOG_NAME).display()
    );

    let log = log_file(&dir);

    let child = Command::new(&binary)
        .arg("run")
        .arg("-c")
        .arg(&config_path)
        .stdin(Stdio::null())
        .stdout(log.0)
        .stderr(log.1)
        .kill_on_drop(true)
        .spawn()
        .map_err(|error| TunnelError::Singbox(format!("cannot start {BINARY}: {error}")))?;

    Ok(Singbox { child, config_path })
}
