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
