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

#[cfg(test)]
mod tests {
    use std::path::PathBuf;

    use super::*;

    fn app(name: &str, path: &str) -> InstalledApp {
        InstalledApp {
            name: name.to_string(),
            path: path.to_string(),
        }
    }

    fn found(entries: &[(&str, &str)]) -> BTreeMap<String, InstalledApp> {
        entries.iter().map(|(name, path)| (path.to_lowercase(), app(name, path))).collect()
    }

    #[test]
    fn sorts_apps_by_name_ignoring_case() {
        let apps = sorted(found(&[("Zed", "/a/zed"), ("alacritty", "/b/alacritty"), ("Firefox", "/c/firefox")]));

        let names: Vec<&str> = apps.iter().map(|app| app.name.as_str()).collect();

        assert_eq!(names, vec!["alacritty", "Firefox", "Zed"]);
    }

    #[test]
    fn keeps_every_distinct_entry() {
        let apps = sorted(found(&[("Firefox", "/a/firefox"), ("Chrome", "/b/chrome")]));

        assert_eq!(apps.len(), 2);
    }

    #[test]
    fn returns_nothing_for_an_empty_map() {
        assert!(sorted(BTreeMap::new()).is_empty());
    }

    #[cfg(target_os = "windows")]
    #[test]
    fn counts_only_executables_as_user_facing() {
        assert!(is_user_facing(&PathBuf::from(r"C:\Program Files\Firefox\firefox.exe")));
        assert!(is_user_facing(&PathBuf::from(r"C:\Program Files\Firefox\FIREFOX.EXE")));

        assert!(!is_user_facing(&PathBuf::from(r"C:\Windows\System32\driver.sys")));
        assert!(!is_user_facing(&PathBuf::from(r"C:\Windows\System32\lib.dll")));
        assert!(!is_user_facing(&PathBuf::from(r"C:\Windows\System32")));
    }

    #[cfg(target_os = "macos")]
    #[test]
    fn counts_only_bundle_executables_as_user_facing() {
        assert!(is_user_facing(&PathBuf::from("/Applications/Firefox.app/Contents/MacOS/firefox")));

        assert!(!is_user_facing(&PathBuf::from("/usr/bin/ssh")));
        assert!(!is_user_facing(&PathBuf::from("/Applications/Firefox.app/Contents/Resources/icon")));
    }

    #[cfg(all(unix, not(target_os = "macos")))]
    #[test]
    fn skips_kernel_and_library_paths() {
        assert!(is_user_facing(&PathBuf::from("/usr/bin/firefox")));
        assert!(is_user_facing(&PathBuf::from("/opt/app/bin/app")));

        assert!(!is_user_facing(&PathBuf::from("/proc/1/exe")));
        assert!(!is_user_facing(&PathBuf::from("/usr/lib/systemd/systemd")));
        assert!(!is_user_facing(&PathBuf::from("relative/path")));
    }
}
