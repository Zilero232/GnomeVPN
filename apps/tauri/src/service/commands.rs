use std::process::Command;

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

/// Registers and starts the privileged service, prompting for elevation once.
///
/// `gnomevpn-service.exe install` is idempotent: it creates the service when
/// missing and starts it when merely stopped, so this one call repairs both
/// states. The GUI itself runs unprivileged, so the install is launched through
/// `Start-Process -Verb RunAs`, which raises the UAC dialog.
#[tauri::command]
pub async fn service_repair() -> Result<(), ServiceError> {
    let exe = std::env::current_exe()
        .ok()
        .and_then(|path| path.parent().map(|dir| dir.join("gnomevpn-service.exe")))
        .filter(|path| path.exists())
        .ok_or(ServiceError::BinaryMissing)?;

    log::info!("service_repair: elevating to install/start the service");

    let status = Command::new("powershell")
        .args([
            "-NoProfile",
            "-NonInteractive",
            "-Command",
            &format!(
                "$p = Start-Process -FilePath '{}' -ArgumentList 'install' -Verb RunAs -Wait -PassThru; exit $p.ExitCode",
                exe.display()
            ),
        ])
        .status()
        .map_err(|error| {
            log::error!("service_repair: failed to spawn powershell: {error}");
            ServiceError::Launch
        })?;

    match status.code() {
        Some(0) => Ok(()),
        // Start-Process raises this when the user dismisses the UAC prompt.
        Some(1) | None => Err(ServiceError::Declined),
        Some(code) => Err(ServiceError::InstallFailed(code)),
    }
}
