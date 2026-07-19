use std::net::{IpAddr, Ipv4Addr, SocketAddr};

use crate::types::TunnelConfig;

const WG_KEY_LEN: usize = 44;

const ALLOWED_IPS: [&str; 2] = ["0.0.0.0/0", "::/0"];

const MAX_KEEPALIVE: u16 = 3600;

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

fn check_key(field: &'static str, value: &str) -> Result<(), ValidationError> {
    if value.len() != WG_KEY_LEN {
        return Err(reject(field, format!("expected {WG_KEY_LEN} base64 chars")));
    }

    let is_base64 = value
        .bytes()
        .all(|byte| byte.is_ascii_alphanumeric() || byte == b'+' || byte == b'/' || byte == b'=');

    if !is_base64 {
        return Err(reject(field, "not base64"));
    }

    Ok(())
}

fn check_address(value: &str) -> Result<(), ValidationError> {
    let Some((ip, prefix)) = value.split_once('/') else {
        return Err(reject("address", "missing prefix"));
    };

    let ip: Ipv4Addr = ip
        .parse()
        .map_err(|_| reject("address", "not an ipv4 address"))?;

    let prefix: u8 = prefix
        .parse()
        .map_err(|_| reject("address", "bad prefix"))?;

    if prefix > 32 {
        return Err(reject("address", "prefix out of range"));
    }

    if !ip.is_private() {
        return Err(reject("address", "must be a private address"));
    }

    Ok(())
}

fn check_endpoint(value: &str) -> Result<(), ValidationError> {
    let addr: SocketAddr = value
        .parse()
        .map_err(|_| reject("endpoint", "expected host:port"))?;

    if addr.port() == 0 {
        return Err(reject("endpoint", "port must not be zero"));
    }

    let is_public = match addr.ip() {
        IpAddr::V4(ip) => {
            !(ip.is_loopback() || ip.is_private() || ip.is_link_local() || ip.is_unspecified())
        }
        IpAddr::V6(ip) => !(ip.is_loopback() || ip.is_unspecified()),
    };

    if !is_public {
        return Err(reject("endpoint", "must be a public address"));
    }

    Ok(())
}

fn check_dns(value: &str) -> Result<(), ValidationError> {
    if value.is_empty() {
        return Err(reject("dns", "must not be empty"));
    }

    for entry in value.split(',') {
        entry
            .trim()
            .parse::<IpAddr>()
            .map_err(|_| reject("dns", format!("not an ip address: {entry}")))?;
    }

    Ok(())
}

fn check_allowed_ips(values: &[String]) -> Result<(), ValidationError> {
    if values.is_empty() {
        return Err(reject("allowedIps", "must not be empty"));
    }

    for value in values {
        if !ALLOWED_IPS.contains(&value.as_str()) {
            return Err(reject(
                "allowedIps",
                format!("unsupported entry: {value}; expected one of {ALLOWED_IPS:?}"),
            ));
        }
    }

    Ok(())
}

pub fn validate_tunnel_config(config: &TunnelConfig) -> Result<(), ValidationError> {
    check_key("privateKey", &config.private_key)?;
    check_key("serverPublicKey", &config.server_public_key)?;

    if let Some(psk) = &config.preshared_key {
        check_key("presharedKey", psk)?;
    }

    check_address(&config.address)?;
    check_endpoint(&config.endpoint)?;
    check_dns(&config.dns)?;
    check_allowed_ips(&config.allowed_ips)?;

    if config.persistent_keepalive > MAX_KEEPALIVE {
        return Err(reject("persistentKeepalive", "out of range"));
    }

    Ok(())
}
