use std::net::IpAddr;

use crate::types::{SplitConfig, TunnelConfig, TunnelProtocol, WireguardConfig};

const MAX_HOST_LEN: usize = 253;

const MAX_AUTH_LEN: usize = 256;

const MAX_KEY_LEN: usize = 128;

const MAX_SPLIT_APPS: usize = 128;

const MAX_SPLIT_IPS: usize = 128;

#[cfg(target_os = "windows")]
const MAX_PATH_LEN: usize = 260;

#[cfg(not(target_os = "windows"))]
const MAX_PATH_LEN: usize = 1024;

#[derive(Debug, thiserror::Error, PartialEq, Eq)]
pub enum ValidationError {
    #[error("bad {field}: {reason}")]
    Field { field: &'static str, reason: String },
}

fn reject(field: &'static str, reason: impl Into<String>) -> ValidationError {
    ValidationError::Field {
        field,
        reason: reason.into(),
    }
}

fn check_auth(value: &str) -> Result<(), ValidationError> {
    if value.is_empty() {
        return Err(reject("auth", "must not be empty"));
    }

    if value.len() > MAX_AUTH_LEN {
        return Err(reject("auth", "too long"));
    }

    Ok(())
}

fn check_host(field: &'static str, value: &str) -> Result<(), ValidationError> {
    if value.is_empty() {
        return Err(reject(field, "must not be empty"));
    }

    if value.len() > MAX_HOST_LEN {
        return Err(reject(field, "too long"));
    }

    let is_hostname = value.bytes().all(|byte| byte.is_ascii_alphanumeric() || byte == b'.' || byte == b'-');

    if !is_hostname {
        return Err(reject(field, "not a hostname or ip address"));
    }

    if let Ok(ip) = value.parse::<IpAddr>() {
        let is_public = match ip {
            IpAddr::V4(ip) => !(ip.is_loopback() || ip.is_private() || ip.is_link_local() || ip.is_unspecified()),
            IpAddr::V6(ip) => !(ip.is_loopback() || ip.is_unspecified() || ip.is_unique_local() || ip.is_unicast_link_local()),
        };

        if !is_public {
            return Err(reject(field, "must be a public address"));
        }
    }

    Ok(())
}

fn check_dns(values: &[String]) -> Result<(), ValidationError> {
    if values.is_empty() {
        return Err(reject("dns", "must not be empty"));
    }

    for entry in values {
        entry
            .parse::<IpAddr>()
            .map_err(|_| reject("dns", format!("not an ip address: {entry}")))?;
    }

    Ok(())
}

fn is_windows_drive_path(path: &str) -> bool {
    let mut chars = path.chars();

    chars.next().is_some_and(|drive| drive.is_ascii_alphabetic()) && chars.next() == Some(':') && chars.next() == Some('\\')
}

fn is_absolute_app_path(path: &str) -> bool {
    if cfg!(target_os = "windows") {
        path.starts_with(r"\\") || is_windows_drive_path(path)
    } else {
        path.starts_with('/')
    }
}

fn validate_app_paths(field: &'static str, paths: &[String]) -> Result<(), ValidationError> {
    if paths.len() > MAX_SPLIT_APPS {
        return Err(reject(field, "too many entries"));
    }

    for path in paths {
        if path.is_empty() {
            return Err(reject(field, "must not be empty"));
        }

        if path.len() > MAX_PATH_LEN {
            return Err(reject(field, "path too long"));
        }

        if path.contains('\0') || path.contains("..") {
            return Err(reject(field, format!("suspicious path: {path}")));
        }

        if !is_absolute_app_path(path) {
            return Err(reject(field, format!("not an absolute path: {path}")));
        }
    }

    Ok(())
}

fn validate_ip_cidrs(field: &'static str, cidrs: &[String]) -> Result<(), ValidationError> {
    if cidrs.len() > MAX_SPLIT_IPS {
        return Err(reject(field, "too many entries"));
    }

    for cidr in cidrs {
        if !is_valid_cidr(cidr) {
            return Err(reject(field, format!("not an ip or cidr: {cidr}")));
        }
    }

    Ok(())
}

fn is_valid_cidr(value: &str) -> bool {
    let Some((address, prefix)) = value.split_once('/') else {
        return value.parse::<IpAddr>().is_ok();
    };

    let Ok(ip) = address.parse::<IpAddr>() else {
        return false;
    };

    let Ok(bits) = prefix.parse::<u8>() else {
        return false;
    };

    let max_bits = if ip.is_ipv4() { 32 } else { 128 };

    bits <= max_bits
}

pub fn validate_split(split: &SplitConfig) -> Result<(), ValidationError> {
    validate_app_paths("apps", &split.apps)?;
    validate_ip_cidrs("ips", &split.ips)?;

    Ok(())
}

fn check_key(field: &'static str, value: &str) -> Result<(), ValidationError> {
    if value.is_empty() {
        return Err(reject(field, "must not be empty"));
    }

    if value.len() > MAX_KEY_LEN {
        return Err(reject(field, "too long"));
    }

    Ok(())
}

fn validate_wireguard(wireguard: &WireguardConfig) -> Result<(), ValidationError> {
    check_key("wireguard.privateKey", &wireguard.private_key)?;
    check_key("wireguard.peerPublicKey", &wireguard.peer_public_key)?;

    if let Some(pre_shared_key) = &wireguard.pre_shared_key {
        check_key("wireguard.preSharedKey", pre_shared_key)?;
    }

    if !is_valid_cidr(&wireguard.address) {
        return Err(reject("wireguard.address", "not an ip or cidr"));
    }

    validate_ip_cidrs("wireguard.allowedIps", &wireguard.allowed_ips)?;

    Ok(())
}

pub fn validate_tunnel_config(config: &TunnelConfig) -> Result<(), ValidationError> {
    check_host("server", &config.server)?;

    if config.port == 0 {
        return Err(reject("port", "must not be zero"));
    }

    check_dns(&config.dns)?;

    match config.protocol {
        TunnelProtocol::Hysteria2 => {
            check_auth(&config.auth)?;
            check_host("serverName", &config.server_name)?;
        }
        TunnelProtocol::Wireguard => {
            let wireguard = config.wireguard.as_ref().ok_or_else(|| reject("wireguard", "must be present"))?;

            validate_wireguard(wireguard)?;
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn hysteria_config() -> TunnelConfig {
        TunnelConfig {
            protocol: TunnelProtocol::Hysteria2,
            server: "203.0.113.10".to_string(),
            port: 443,
            auth: "peer-password".to_string(),
            server_name: "masquerade.example".to_string(),
            insecure: true,
            dns: vec!["1.1.1.1".to_string()],
            wireguard: None,
        }
    }

    fn wireguard_config() -> TunnelConfig {
        TunnelConfig {
            protocol: TunnelProtocol::Wireguard,
            server: "203.0.113.10".to_string(),
            port: 51820,
            auth: String::new(),
            server_name: String::new(),
            insecure: false,
            dns: vec!["1.1.1.1".to_string()],
            wireguard: Some(WireguardConfig {
                private_key: "private".to_string(),
                address: "10.0.0.2/32".to_string(),
                peer_public_key: "public".to_string(),
                pre_shared_key: None,
                allowed_ips: vec!["0.0.0.0/0".to_string()],
                reserved: Vec::new(),
                mtu: None,
            }),
        }
    }

    fn field_of(error: ValidationError) -> &'static str {
        let ValidationError::Field { field, .. } = error;

        field
    }

    #[test]
    fn accepts_a_complete_hysteria_config() {
        assert!(validate_tunnel_config(&hysteria_config()).is_ok());
    }

    #[test]
    fn accepts_a_hostname_as_the_server() {
        let config = TunnelConfig {
            server: "node-01.example.com".to_string(),
            ..hysteria_config()
        };

        assert!(validate_tunnel_config(&config).is_ok());
    }

    #[test]
    fn rejects_a_private_or_loopback_server() {
        for server in ["127.0.0.1", "10.0.0.1", "192.168.1.1", "169.254.1.1", "0.0.0.0", "::1"] {
            let config = TunnelConfig {
                server: server.to_string(),
                ..hysteria_config()
            };

            let error = validate_tunnel_config(&config).expect_err(server);

            assert_eq!(field_of(error), "server");
        }
    }

    #[test]
    fn rejects_a_server_that_is_not_a_hostname() {
        let config = TunnelConfig {
            server: "node one/../etc".to_string(),
            ..hysteria_config()
        };

        assert_eq!(field_of(validate_tunnel_config(&config).unwrap_err()), "server");
    }

    #[test]
    fn rejects_an_empty_or_overlong_server() {
        for server in [String::new(), "a".repeat(MAX_HOST_LEN + 1)] {
            let config = TunnelConfig { server, ..hysteria_config() };

            assert_eq!(field_of(validate_tunnel_config(&config).unwrap_err()), "server");
        }
    }

    #[test]
    fn rejects_port_zero() {
        let config = TunnelConfig {
            port: 0,
            ..hysteria_config()
        };

        assert_eq!(field_of(validate_tunnel_config(&config).unwrap_err()), "port");
    }

    #[test]
    fn rejects_empty_or_non_ip_dns() {
        for dns in [vec![], vec!["not-an-ip".to_string()]] {
            let config = TunnelConfig { dns, ..hysteria_config() };

            assert_eq!(field_of(validate_tunnel_config(&config).unwrap_err()), "dns");
        }
    }

    #[test]
    fn rejects_empty_or_overlong_hysteria_auth() {
        for auth in [String::new(), "a".repeat(MAX_AUTH_LEN + 1)] {
            let config = TunnelConfig { auth, ..hysteria_config() };

            assert_eq!(field_of(validate_tunnel_config(&config).unwrap_err()), "auth");
        }
    }

    #[test]
    fn requires_a_server_name_for_hysteria() {
        let config = TunnelConfig {
            server_name: String::new(),
            ..hysteria_config()
        };

        assert_eq!(field_of(validate_tunnel_config(&config).unwrap_err()), "serverName");
    }

    #[test]
    fn accepts_a_complete_wireguard_config() {
        assert!(validate_tunnel_config(&wireguard_config()).is_ok());
    }

    #[test]
    fn rejects_wireguard_without_its_section() {
        let config = TunnelConfig {
            wireguard: None,
            ..wireguard_config()
        };

        assert_eq!(field_of(validate_tunnel_config(&config).unwrap_err()), "wireguard");
    }

    #[test]
    fn ignores_hysteria_fields_when_the_protocol_is_wireguard() {
        let config = TunnelConfig {
            auth: String::new(),
            server_name: String::new(),
            ..wireguard_config()
        };

        assert!(validate_tunnel_config(&config).is_ok());
    }

    #[test]
    fn rejects_empty_wireguard_keys() {
        let mut config = wireguard_config();

        config.wireguard.as_mut().unwrap().private_key = String::new();

        assert_eq!(field_of(validate_tunnel_config(&config).unwrap_err()), "wireguard.privateKey");
    }

    #[test]
    fn rejects_a_wireguard_address_that_is_not_a_cidr() {
        let mut config = wireguard_config();

        config.wireguard.as_mut().unwrap().address = "10.0.0.2/33".to_string();

        assert_eq!(field_of(validate_tunnel_config(&config).unwrap_err()), "wireguard.address");
    }

    #[test]
    fn accepts_ips_and_cidrs_in_a_split_config() {
        let split = SplitConfig {
            ips: vec![
                "1.1.1.1".to_string(),
                "10.0.0.0/8".to_string(),
                "::1".to_string(),
                "2001:db8::/32".to_string(),
            ],
            ..SplitConfig::default()
        };

        assert!(validate_split(&split).is_ok());
    }

    #[test]
    fn rejects_a_split_entry_that_is_not_an_ip_or_cidr() {
        for entry in ["not-an-ip", "10.0.0.0/33", "10.0.0.0/x", "example.com"] {
            let split = SplitConfig {
                ips: vec![entry.to_string()],
                ..SplitConfig::default()
            };

            assert_eq!(field_of(validate_split(&split).unwrap_err()), "ips");
        }
    }

    #[test]
    fn rejects_more_split_entries_than_the_limit() {
        let split = SplitConfig {
            ips: vec!["1.1.1.1".to_string(); MAX_SPLIT_IPS + 1],
            ..SplitConfig::default()
        };

        assert_eq!(field_of(validate_split(&split).unwrap_err()), "ips");
    }

    #[test]
    fn rejects_a_traversal_or_nul_byte_in_an_app_path() {
        let prefix = if cfg!(target_os = "windows") { r"C:\apps\" } else { "/usr/bin/" };

        for suffix in ["../escape", "app\0"] {
            let split = SplitConfig {
                apps: vec![format!("{prefix}{suffix}")],
                ..SplitConfig::default()
            };

            assert_eq!(field_of(validate_split(&split).unwrap_err()), "apps");
        }
    }

    #[test]
    fn rejects_a_relative_app_path() {
        let split = SplitConfig {
            apps: vec!["firefox.exe".to_string()],
            ..SplitConfig::default()
        };

        assert_eq!(field_of(validate_split(&split).unwrap_err()), "apps");
    }

    #[test]
    fn accepts_an_absolute_app_path() {
        let path = if cfg!(target_os = "windows") {
            r"C:\Program Files\Firefox\firefox.exe"
        } else {
            "/usr/bin/firefox"
        };

        let split = SplitConfig {
            apps: vec![path.to_string()],
            ..SplitConfig::default()
        };

        assert!(validate_split(&split).is_ok());
    }

    #[test]
    fn accepts_an_empty_split_config() {
        assert!(validate_split(&SplitConfig::default()).is_ok());
    }
}
