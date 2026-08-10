use std::collections::BTreeMap;
use std::path::Path;

use super::InstalledApp;

#[cfg(all(unix, not(target_os = "macos")))]
mod linux;
#[cfg(target_os = "macos")]
mod macos;
#[cfg(target_os = "windows")]
mod windows;

#[cfg(all(unix, not(target_os = "macos")))]
pub use linux::installed_apps;
#[cfg(target_os = "macos")]
pub use macos::installed_apps;
#[cfg(target_os = "windows")]
pub use windows::installed_apps;

#[cfg(target_os = "windows")]
fn is_user_facing(path: &Path) -> bool {
    path.extension().is_some_and(|extension| extension.eq_ignore_ascii_case("exe"))
}

#[cfg(target_os = "macos")]
fn is_user_facing(path: &Path) -> bool {
    path.to_string_lossy().contains("/Contents/MacOS/")
}

#[cfg(all(unix, not(target_os = "macos")))]
fn is_user_facing(path: &Path) -> bool {
    path.is_absolute() && !path.starts_with("/proc") && !path.starts_with("/usr/lib")
}

pub fn running_processes() -> Vec<InstalledApp> {
    let mut system = sysinfo::System::new();
    system.refresh_processes(sysinfo::ProcessesToUpdate::All, true);

    let mut found: BTreeMap<String, InstalledApp> = BTreeMap::new();

    for process in system.processes().values() {
        let Some(path) = process.exe() else {
            continue;
        };

        if !is_user_facing(path) {
            continue;
        }

        let name = path
            .file_stem()
            .map(|stem| stem.to_string_lossy().into_owned())
            .unwrap_or_else(|| process.name().to_string_lossy().into_owned());

        found.entry(path.to_string_lossy().to_lowercase()).or_insert(InstalledApp {
            name,
            path: path.to_string_lossy().into_owned(),
        });
    }

    sorted(found)
}

pub fn sorted(found: BTreeMap<String, InstalledApp>) -> Vec<InstalledApp> {
    let mut apps: Vec<InstalledApp> = found.into_values().collect();

    apps.sort_by_key(|app| app.name.to_lowercase());

    apps
}
