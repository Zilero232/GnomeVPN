use std::net::IpAddr;
use std::process::Command;

pub fn apply_default_route(iface: &str, endpoint: IpAddr, dns: &str) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        run(Command::new("route").args([
            "add",
            &endpoint.to_string(),
            "MASK",
            "255.255.255.255",
            &default_gateway_windows()?,
        ]))?;
        run(Command::new("route").args([
            "add",
            "0.0.0.0",
            "MASK",
            "0.0.0.0",
            dns,
            "IF",
            &iface_index_windows(iface)?,
        ]))?;
        Ok(())
    }
    #[cfg(target_os = "linux")]
    {
        let gw = default_gateway_unix()?;
        run(Command::new("ip").args(["route", "add", &format!("{endpoint}/32"), "via", &gw]))?;
        run(Command::new("ip").args(["route", "add", "default", "dev", iface]))?;
        Ok(())
    }
    #[cfg(target_os = "macos")]
    {
        let gw = default_gateway_unix()?;
        run(Command::new("route").args(["-n", "add", "-host", &endpoint.to_string(), &gw]))?;
        run(Command::new("route").args(["-n", "add", "-net", "0.0.0.0/1", "-interface", iface]))?;
        run(Command::new("route").args(["-n", "add", "-net", "128.0.0.0/1", "-interface", iface]))?;
        Ok(())
    }
    #[cfg(not(any(target_os = "windows", target_os = "linux", target_os = "macos")))]
    {
        let _ = (iface, endpoint, dns);
        Err("unsupported platform".into())
    }
}

pub fn remove_default_route(iface: &str, endpoint: IpAddr) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let _ = iface;
        let _ = run(Command::new("route").args(["delete", &endpoint.to_string()]));
        let _ = run(Command::new("route").args(["delete", "0.0.0.0", "MASK", "0.0.0.0"]));
        Ok(())
    }
    #[cfg(target_os = "linux")]
    {
        let _ = run(Command::new("ip").args(["route", "del", &format!("{endpoint}/32")]));
        let _ = run(Command::new("ip").args(["route", "del", "default", "dev", iface]));
        Ok(())
    }
    #[cfg(target_os = "macos")]
    {
        let _ = iface;
        let _ = run(Command::new("route").args(["-n", "delete", "-host", &endpoint.to_string()]));
        let _ = run(Command::new("route").args(["-n", "delete", "-net", "0.0.0.0/1"]));
        let _ = run(Command::new("route").args(["-n", "delete", "-net", "128.0.0.0/1"]));
        Ok(())
    }
    #[cfg(not(any(target_os = "windows", target_os = "linux", target_os = "macos")))]
    {
        let _ = (iface, endpoint);
        Ok(())
    }
}

#[cfg_attr(
    not(any(target_os = "windows", target_os = "linux", target_os = "macos")),
    allow(dead_code)
)]
fn run(cmd: &mut Command) -> Result<(), String> {
    let out = cmd.output().map_err(|e| e.to_string())?;
    if out.status.success() {
        Ok(())
    } else {
        Err(String::from_utf8_lossy(&out.stderr).to_string())
    }
}

#[cfg_attr(
    not(any(target_os = "windows", target_os = "linux", target_os = "macos")),
    allow(dead_code)
)]
fn capture(cmd: &mut Command) -> Result<String, String> {
    let out = cmd.output().map_err(|e| e.to_string())?;
    if !out.status.success() {
        return Err(String::from_utf8_lossy(&out.stderr).to_string());
    }
    Ok(String::from_utf8_lossy(&out.stdout).trim().to_string())
}

#[cfg(target_os = "windows")]
fn powershell(script: &str) -> Result<String, String> {
    capture(Command::new("powershell").args(["-NoProfile", "-NonInteractive", "-Command", script]))
}

#[cfg(target_os = "windows")]
fn default_gateway_windows() -> Result<String, String> {
    let value = powershell(
        "(Get-NetRoute -DestinationPrefix '0.0.0.0/0' | Sort-Object RouteMetric | Select-Object -First 1).NextHop",
    )?;
    if value.is_empty() {
        return Err("no default gateway found".into());
    }
    Ok(value)
}

#[cfg(target_os = "windows")]
fn iface_index_windows(iface: &str) -> Result<String, String> {
    let value = powershell(&format!(
        "(Get-NetAdapter -Name '{iface}' -ErrorAction SilentlyContinue).ifIndex"
    ))?;
    if value.is_empty() {
        return Err(format!("interface not found: {iface}"));
    }
    Ok(value)
}

#[cfg(any(target_os = "linux", target_os = "macos"))]
fn default_gateway_unix() -> Result<String, String> {
    #[cfg(target_os = "linux")]
    {
        let out = capture(Command::new("ip").args(["route", "show", "default"]))?;
        out.split_whitespace()
            .nth(2)
            .map(str::to_string)
            .ok_or_else(|| "no default gateway found".into())
    }
    #[cfg(target_os = "macos")]
    {
        let out = capture(Command::new("route").args(["-n", "get", "default"]))?;
        out.lines()
            .find_map(|line| line.trim().strip_prefix("gateway:"))
            .map(|value| value.trim().to_string())
            .ok_or_else(|| "no default gateway found".into())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::net::Ipv4Addr;

    #[cfg(target_os = "windows")]
    #[test]
    fn resolves_a_real_default_gateway() {
        let gw = default_gateway_windows().expect("gateway must resolve");
        assert!(gw.parse::<IpAddr>().is_ok(), "not an ip: {gw}");
        assert_ne!(gw, "0.0.0.0");
    }

    #[test]
    fn remove_default_route_never_panics_on_missing_route() {
        let result =
            remove_default_route("vesper-test0", IpAddr::V4(Ipv4Addr::new(203, 0, 113, 1)));
        assert!(result.is_ok());
    }
}
