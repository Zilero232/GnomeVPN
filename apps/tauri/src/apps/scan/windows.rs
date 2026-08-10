use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

use lnk::ShellLink;

use super::InstalledApp;

const START_MENU: &str = r"Microsoft\Windows\Start Menu\Programs";

fn start_menu_roots() -> Vec<PathBuf> {
    ["ProgramData", "APPDATA"]
        .iter()
        .filter_map(std::env::var_os)
        .map(|base| PathBuf::from(base).join(START_MENU))
        .collect()
}

fn target_of(shortcut: &Path) -> Option<PathBuf> {
    let link = ShellLink::open(shortcut, lnk::encoding::WINDOWS_1252).ok()?;
    let info = link.link_info().as_ref()?;
    let path = PathBuf::from(info.local_base_path()?);

    path.extension()
        .is_some_and(|extension| extension.eq_ignore_ascii_case("exe"))
        .then_some(path)
}

fn collect(dir: &Path, found: &mut BTreeMap<String, InstalledApp>) {
    let Ok(entries) = std::fs::read_dir(dir) else {
        return;
    };

    for entry in entries.flatten() {
        let path = entry.path();

        if path.is_dir() {
            collect(&path, found);

            continue;
        }

        if path.extension().is_none_or(|ext| !ext.eq_ignore_ascii_case("lnk")) {
            continue;
        }

        let Some(target) = target_of(&path) else {
            continue;
        };

        let Some(name) = path.file_stem().map(|stem| stem.to_string_lossy().into_owned()) else {
            continue;
        };

        found.entry(target.to_string_lossy().to_lowercase()).or_insert(InstalledApp {
            name,
            path: target.to_string_lossy().into_owned(),
        });
    }
}

pub fn installed_apps() -> Vec<InstalledApp> {
    let mut found = BTreeMap::new();

    for root in start_menu_roots() {
        collect(&root, &mut found);
    }

    let mut apps: Vec<InstalledApp> = found.into_values().collect();
    apps.sort_by_key(|app| app.name.to_lowercase());

    apps
}
