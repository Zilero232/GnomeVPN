#[cfg(target_os = "windows")]
mod scan;

use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InstalledApp {
    pub name: String,
    pub path: String,
}

#[tauri::command]
pub async fn list_installed_apps() -> Vec<InstalledApp> {
    #[cfg(target_os = "windows")]
    {
        tauri::async_runtime::spawn_blocking(scan::installed_apps).await.unwrap_or_default()
    }

    #[cfg(not(target_os = "windows"))]
    Vec::new()
}

#[tauri::command]
pub async fn list_running_processes() -> Vec<InstalledApp> {
    #[cfg(target_os = "windows")]
    {
        tauri::async_runtime::spawn_blocking(scan::running_processes).await.unwrap_or_default()
    }

    #[cfg(not(target_os = "windows"))]
    Vec::new()
}
