use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use std::process::Command;

use super::{DESCRIPTION, DISPLAY_NAME};

const LAUNCHD_LABEL: &str = "app.gnomevpn.service";

const SYSTEMD_UNIT: &str = "gnomevpn.service";

fn unit_path() -> PathBuf {
    if cfg!(target_os = "macos") {
        PathBuf::from("/Library/LaunchDaemons").join(format!("{LAUNCHD_LABEL}.plist"))
    } else {
        PathBuf::from("/etc/systemd/system").join(SYSTEMD_UNIT)
    }
}

fn launchd_plist(binary: &Path) -> String {
    format!(
        r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>{LAUNCHD_LABEL}</string>
    <key>ProgramArguments</key>
    <array>
        <string>{binary}</string>
        <string>run</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardErrorPath</key>
    <string>/Library/Logs/GnomeVPN/launchd.log</string>
    <key>StandardOutPath</key>
    <string>/Library/Logs/GnomeVPN/launchd.log</string>
</dict>
</plist>
"#,
        binary = binary.display()
    )
}

fn systemd_unit(binary: &Path) -> String {
    format!(
        "[Unit]\n\
         Description={DISPLAY_NAME} — {DESCRIPTION}\n\
         After=network.target\n\
         \n\
         [Service]\n\
         Type=simple\n\
         ExecStart={binary} run\n\
         Restart=on-failure\n\
         RestartSec=2\n\
         User=root\n\
         \n\
         [Install]\n\
         WantedBy=multi-user.target\n",
        binary = binary.display()
    )
}

fn run(program: &str, args: &[&str]) -> io::Result<()> {
    let status = Command::new(program).args(args).status()?;

    if status.success() {
        return Ok(());
    }

    Err(io::Error::other(format!("{program} {} failed with {status}", args.join(" "))))
}

pub fn install() -> io::Result<()> {
    let binary = std::env::current_exe()?;
    let unit = unit_path();

    if let Some(parent) = unit.parent() {
        fs::create_dir_all(parent)?;
    }

    if cfg!(target_os = "macos") {
        fs::write(&unit, launchd_plist(&binary))?;

        let _ = run("launchctl", &["bootout", "system", &unit.to_string_lossy()]);

        run("launchctl", &["bootstrap", "system", &unit.to_string_lossy()])?;
    } else {
        fs::write(&unit, systemd_unit(&binary))?;

        run("systemctl", &["daemon-reload"])?;
        run("systemctl", &["enable", "--now", SYSTEMD_UNIT])?;
    }

    Ok(())
}

pub fn uninstall() -> io::Result<()> {
    let unit = unit_path();

    if cfg!(target_os = "macos") {
        let _ = run("launchctl", &["bootout", "system", &unit.to_string_lossy()]);
    } else {
        let _ = run("systemctl", &["disable", "--now", SYSTEMD_UNIT]);
    }

    if unit.exists() {
        fs::remove_file(&unit)?;
    }

    if !cfg!(target_os = "macos") {
        let _ = run("systemctl", &["daemon-reload"]);
    }

    Ok(())
}
