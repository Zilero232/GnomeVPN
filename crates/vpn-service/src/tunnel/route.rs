use std::net::IpAddr;
use std::process::Command;

#[cfg(target_os = "windows")]
const HALF_ROUTES: [(&str, &str); 2] = [("0.0.0.0", "128.0.0.0"), ("128.0.0.0", "128.0.0.0")];

#[cfg(target_os = "windows")]
const LAN_ROUTES: [(&str, &str); 4] = [
    ("192.168.0.0", "255.255.0.0"),
    ("10.0.0.0", "255.0.0.0"),
    ("172.16.0.0", "255.240.0.0"),
    ("169.254.0.0", "255.255.0.0"),
];

#[cfg_attr(not(target_os = "windows"), allow(dead_code))]
pub fn windows_add_args(
    destination: &str,
    mask: &str,
    gateway: &str,
    iface_index: &str,
    metric: &str,
) -> Vec<String> {
    vec![
        "add".into(),
        destination.into(),
        "MASK".into(),
        mask.into(),
        gateway.into(),
        "METRIC".into(),
        metric.into(),
        "IF".into(),
        iface_index.into(),
    ]
}

#[cfg_attr(not(target_os = "windows"), allow(dead_code))]
pub fn windows_delete_args(destination: &str, mask: &str) -> Vec<String> {
    vec![
        "delete".into(),
        destination.into(),
        "MASK".into(),
        mask.into(),
    ]
}

#[cfg_attr(not(target_os = "windows"), allow(dead_code))]
pub fn covers_tunnel(destination: &str, mask: &str, tunnel_gateway: IpAddr) -> bool {
    let (IpAddr::V4(gateway), Ok(network), Ok(mask)) = (
        tunnel_gateway,
        destination.parse::<std::net::Ipv4Addr>(),
        mask.parse::<std::net::Ipv4Addr>(),
    ) else {
        return false;
    };

    u32::from(gateway) & u32::from(mask) == u32::from(network) & u32::from(mask)
}

pub fn apply_default_route(
    iface: &str,
    endpoint: IpAddr,
    tunnel_gateway: IpAddr,
) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let index = iface_index_windows(iface)?;
        let physical_gateway = default_gateway_windows()?;

        run(Command::new("route").args(windows_add_args(
            &endpoint.to_string(),
            "255.255.255.255",
            &physical_gateway,
            &physical_iface_index_windows()?,
            "1",
        )))?;

        for (destination, mask) in HALF_ROUTES {
            run(Command::new("route").args(windows_add_args(
                destination,
                mask,
                &tunnel_gateway.to_string(),
                &index,
                "1",
            )))?;
        }

        let physical_index = physical_iface_index_windows()?;

        for (destination, mask) in LAN_ROUTES {
            if covers_tunnel(destination, mask, tunnel_gateway) {
                continue;
            }

            let _ = run(Command::new("route").args(windows_add_args(
                destination,
                mask,
                &physical_gateway,
                &physical_index,
                "1",
            )));
        }

        Ok(())
    }
    #[cfg(target_os = "linux")]
    {
        let gw = default_gateway_unix()?;
        run(Command::new("ip").args(["route", "add", &format!("{endpoint}/32"), "via", &gw]))?;
        run(Command::new("ip").args(["route", "add", "0.0.0.0/1", "dev", iface]))?;
        run(Command::new("ip").args(["route", "add", "128.0.0.0/1", "dev", iface]))?;
        let _ = tunnel_gateway;
        Ok(())
    }
    #[cfg(target_os = "macos")]
    {
        let gw = default_gateway_unix()?;
        run(Command::new("route").args(["-n", "add", "-host", &endpoint.to_string(), &gw]))?;
        run(Command::new("route").args(["-n", "add", "-net", "0.0.0.0/1", "-interface", iface]))?;
        run(Command::new("route").args(["-n", "add", "-net", "128.0.0.0/1", "-interface", iface]))?;
        let _ = tunnel_gateway;
        Ok(())
    }
    #[cfg(not(any(target_os = "windows", target_os = "linux", target_os = "macos")))]
    {
        let _ = (iface, endpoint, tunnel_gateway);
        Err("unsupported platform".into())
    }
}

pub fn remove_default_route(iface: &str, endpoint: IpAddr) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let _ = iface;
        let _ = run(Command::new("route").args(windows_delete_args(
            &endpoint.to_string(),
            "255.255.255.255",
        )));

        for (destination, mask) in HALF_ROUTES {
            let _ = run(Command::new("route").args(windows_delete_args(destination, mask)));
        }

        for (destination, mask) in LAN_ROUTES {
            let _ = run(Command::new("route").args(windows_delete_args(destination, mask)));
        }

        Ok(())
    }
    #[cfg(target_os = "linux")]
    {
        let _ = run(Command::new("ip").args(["route", "del", &format!("{endpoint}/32")]));
        let _ = run(Command::new("ip").args(["route", "del", "0.0.0.0/1", "dev", iface]));
        let _ = run(Command::new("ip").args(["route", "del", "128.0.0.0/1", "dev", iface]));
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
fn physical_iface_index_windows() -> Result<String, String> {
    let value = powershell(
        "(Get-NetRoute -DestinationPrefix '0.0.0.0/0' | Sort-Object RouteMetric | Select-Object -First 1).ifIndex",
    )?;
    if value.is_empty() {
        return Err("no default interface found".into());
    }
    Ok(value)
}

#[cfg(target_os = "windows")]
fn iface_index_windows(iface: &str) -> Result<String, String> {
    let by_name = powershell(&format!(
        "(Get-NetAdapter -Name '{iface}' -ErrorAction SilentlyContinue).ifIndex"
    ))?;

    if !by_name.is_empty() {
        return Ok(by_name);
    }

    let by_description = powershell(
        "(Get-NetAdapter | Where-Object { $_.InterfaceDescription -like '*Wintun*' } | Select-Object -First 1).ifIndex",
    )?;

    if by_description.is_empty() {
        return Err(format!("interface not found: {iface}"));
    }

    Ok(by_description)
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
