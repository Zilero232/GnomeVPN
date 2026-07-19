use std::net::IpAddr;

const RULE_SERVICE: &str = "GnomeVPN-KillSwitch-Service";
const RULE_ENDPOINT: &str = "GnomeVPN-KillSwitch-Endpoint";
const RULE_LAN: &str = "GnomeVPN-KillSwitch-Lan";
const RULE_BLOCK: &str = "GnomeVPN-KillSwitch-Block";

const RULES: [&str; 4] = [RULE_SERVICE, RULE_ENDPOINT, RULE_LAN, RULE_BLOCK];

const LAN_RANGES: &str = "10.0.0.0/8,192.168.0.0/16,172.16.0.0/12,169.254.0.0/16";

#[cfg(target_os = "windows")]
fn netsh(args: &[&str]) -> Result<(), String> {
    let output = std::process::Command::new("netsh")
        .args(args)
        .output()
        .map_err(|error| error.to_string())?;

    if output.status.success() {
        return Ok(());
    }

    Err(String::from_utf8_lossy(&output.stderr).to_string())
}

#[cfg(target_os = "windows")]
fn add_rule(name: &str, extra: Option<String>, action: &str) -> Result<(), String> {
    let name = format!("name={name}");
    let action = format!("action={action}");

    let mut args = vec![
        "advfirewall",
        "firewall",
        "add",
        "rule",
        &name,
        "dir=out",
        &action,
        "enable=yes",
    ];

    if let Some(extra) = &extra {
        args.push(extra);
    }

    netsh(&args)
}

#[cfg(target_os = "windows")]
pub fn engage(endpoint: IpAddr) -> Result<(), String> {
    disengage();

    let service = std::env::current_exe()
        .map_err(|error| error.to_string())?
        .display()
        .to_string();

    add_rule(RULE_SERVICE, Some(format!("program={service}")), "allow")?;
    add_rule(RULE_ENDPOINT, Some(format!("remoteip={endpoint}")), "allow")?;
    add_rule(RULE_LAN, Some(format!("remoteip={LAN_RANGES}")), "allow")?;
    add_rule(RULE_BLOCK, None, "block")?;

    log::info!("kill switch engaged");

    Ok(())
}

#[cfg(target_os = "windows")]
pub fn disengage() {
    for name in RULES {
        let _ = netsh(&[
            "advfirewall",
            "firewall",
            "delete",
            "rule",
            &format!("name={name}"),
        ]);
    }

    log::info!("kill switch released");
}

#[cfg(not(target_os = "windows"))]
pub fn engage(endpoint: IpAddr) -> Result<(), String> {
    let _ = (endpoint, LAN_RANGES, RULES);

    Ok(())
}

#[cfg(not(target_os = "windows"))]
pub fn disengage() {}
