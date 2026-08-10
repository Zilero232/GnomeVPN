use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

use super::{sorted, InstalledApp};

const DESKTOP_EXTENSION: &str = "desktop";

const DEFAULT_DATA_DIRS: &str = "/usr/local/share:/usr/share";

fn roots() -> Vec<PathBuf> {
    let shared = std::env::var("XDG_DATA_DIRS").unwrap_or_else(|_| DEFAULT_DATA_DIRS.to_string());

    let mut roots: Vec<PathBuf> = shared
        .split(':')
        .filter(|dir| !dir.is_empty())
        .map(|dir| PathBuf::from(dir).join("applications"))
        .collect();

    let home = std::env::var_os("HOME").map(PathBuf::from);

    if let Some(local) = std::env::var_os("XDG_DATA_HOME")
        .map(PathBuf::from)
        .or_else(|| home.map(|home| home.join(".local").join("share")))
    {
        roots.push(local.join("applications"));
    }

    roots
}

fn resolve(command: &str) -> Option<PathBuf> {
    let candidate = PathBuf::from(command);

    if candidate.is_absolute() {
        return candidate.exists().then_some(candidate);
    }

    std::env::var_os("PATH").map(|paths| std::env::split_paths(&paths).map(|dir| dir.join(command)).find(|path| path.exists()))?
}

fn executable_of(exec: &str) -> Option<PathBuf> {
    let command = exec.split_whitespace().find(|token| !token.starts_with('%'))?.trim_matches('"');

    resolve(command)
}

fn entry_of(path: &Path) -> Option<InstalledApp> {
    let contents = std::fs::read_to_string(path).ok()?;

    let mut name = None;
    let mut exec = None;
    let mut hidden = false;

    for line in contents.lines() {
        match line.split_once('=') {
            Some(("Name", value)) if name.is_none() => name = Some(value.trim().to_string()),
            Some(("Exec", value)) if exec.is_none() => exec = Some(value.trim().to_string()),
            Some(("NoDisplay" | "Hidden", value)) if value.trim() == "true" => hidden = true,
            Some(("Type", value)) if value.trim() != "Application" => return None,
            _ => {}
        }
    }

    if hidden {
        return None;
    }

    let executable = executable_of(&exec?)?;

    Some(InstalledApp {
        name: name?,
        path: executable.to_string_lossy().into_owned(),
    })
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

        if path.extension().is_none_or(|extension| extension != DESKTOP_EXTENSION) {
            continue;
        }

        let Some(app) = entry_of(&path) else {
            continue;
        };

        found.entry(app.path.to_lowercase()).or_insert(app);
    }
}

pub fn installed_apps() -> Vec<InstalledApp> {
    let mut found = BTreeMap::new();

    for root in roots() {
        collect(&root, &mut found);
    }

    sorted(found)
}
