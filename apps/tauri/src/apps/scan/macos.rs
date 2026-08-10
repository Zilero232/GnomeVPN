use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

use super::{sorted, InstalledApp};

const BUNDLE_EXTENSION: &str = "app";

const MAX_DEPTH: usize = 2;

fn roots() -> Vec<PathBuf> {
    let mut roots = vec![PathBuf::from("/Applications"), PathBuf::from("/System/Applications")];

    if let Some(home) = std::env::var_os("HOME") {
        roots.push(PathBuf::from(home).join("Applications"));
    }

    roots
}

fn executable_of(bundle: &Path) -> Option<PathBuf> {
    let info = plist::Value::from_file(bundle.join("Contents").join("Info.plist")).ok()?;
    let dictionary = info.as_dictionary()?;
    let executable = dictionary.get("CFBundleExecutable")?.as_string()?;
    let path = bundle.join("Contents").join("MacOS").join(executable);

    path.exists().then_some(path)
}

fn name_of(bundle: &Path) -> Option<String> {
    bundle.file_stem().map(|stem| stem.to_string_lossy().into_owned())
}

fn collect(dir: &Path, depth: usize, found: &mut BTreeMap<String, InstalledApp>) {
    if depth > MAX_DEPTH {
        return;
    }

    let Ok(entries) = std::fs::read_dir(dir) else {
        return;
    };

    for entry in entries.flatten() {
        let path = entry.path();

        if !path.is_dir() {
            continue;
        }

        if path.extension().is_none_or(|extension| extension != BUNDLE_EXTENSION) {
            collect(&path, depth + 1, found);

            continue;
        }

        let Some(executable) = executable_of(&path) else {
            continue;
        };

        let Some(name) = name_of(&path) else {
            continue;
        };

        found.entry(executable.to_string_lossy().to_lowercase()).or_insert(InstalledApp {
            name,
            path: executable.to_string_lossy().into_owned(),
        });
    }
}

pub fn installed_apps() -> Vec<InstalledApp> {
    let mut found = BTreeMap::new();

    for root in roots() {
        collect(&root, 0, &mut found);
    }

    sorted(found)
}
