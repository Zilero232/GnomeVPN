use std::path::Path;
use std::process::Command;

const BINARY: &str = if cfg!(target_os = "windows") {
    "gnomevpn-service.exe"
} else {
    "gnomevpn-service"
};

#[derive(Debug, thiserror::Error)]
pub enum ServiceError {
    #[error("service binary not found next to the app")]
    BinaryMissing,
    #[error("could not launch the elevated installer")]
    Launch,
    #[error("the elevation prompt was declined")]
    Declined,
    #[error("the service installer failed with code {0}")]
    InstallFailed(i32),
}

impl serde::Serialize for ServiceError {
    fn serialize<S: serde::Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(&self.to_string())
    }
}

#[cfg(target_os = "windows")]
fn elevate(binary: &Path) -> Command {
    let mut command = Command::new("powershell");

    command.args([
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        &format!(
            "$p = Start-Process -FilePath '{}' -ArgumentList 'install' -Verb RunAs -Wait -PassThru; exit $p.ExitCode",
            binary.display()
        ),
    ]);

    command
}

#[cfg(target_os = "macos")]
fn shell_quoted(binary: &Path) -> String {
    let escaped = binary.display().to_string().replace('\'', r"'\''");

    format!("'{escaped}'")
}

#[cfg(target_os = "macos")]
fn elevate(binary: &Path) -> Command {
    let mut command = Command::new("osascript");

    let script = format!(
        r#"do shell script "{} install" with administrator privileges"#,
        shell_quoted(binary).replace('\\', r"\\").replace('"', r#"\""#)
    );

    command.args(["-e", &script]);

    command
}

#[cfg(all(unix, not(target_os = "macos")))]
fn elevate(binary: &Path) -> Command {
    let mut command = Command::new("pkexec");

    command.arg(binary).arg("install");

    command
}

fn service_binary() -> Option<std::path::PathBuf> {
    let exe = std::env::current_exe().ok()?;
    let dir = exe.parent()?;

    [dir.join(BINARY), dir.join("../Resources").join(BINARY)]
        .into_iter()
        .find(|path| path.exists())
}

#[tauri::command]
pub async fn service_repair() -> Result<(), ServiceError> {
    let exe = service_binary().ok_or(ServiceError::BinaryMissing)?;

    log::info!("service_repair: elevating to install/start the service");

    let status = elevate(&exe).status().map_err(|error| {
        log::error!("service_repair: failed to spawn the elevation helper: {error}");

        ServiceError::Launch
    })?;

    match status.code() {
        Some(0) => Ok(()),
        Some(1) | Some(126) | None => Err(ServiceError::Declined),
        Some(code) => Err(ServiceError::InstallFailed(code)),
    }
}
