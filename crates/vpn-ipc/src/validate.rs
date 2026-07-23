use std::net::IpAddr;

use crate::types::TunnelConfig;

const MAX_HOST_LEN: usize = 253;

const MAX_AUTH_LEN: usize = 256;

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

    let is_hostname = value
        .bytes()
        .all(|byte| byte.is_ascii_alphanumeric() || byte == b'.' || byte == b'-');

    if !is_hostname {
        return Err(reject(field, "not a hostname or ip address"));
    }

    if let Ok(ip) = value.parse::<IpAddr>() {
        let is_public = match ip {
            IpAddr::V4(ip) => {
                !(ip.is_loopback() || ip.is_private() || ip.is_link_local() || ip.is_unspecified())
            }
            IpAddr::V6(ip) => !(ip.is_loopback() || ip.is_unspecified()),
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

pub fn validate_tunnel_config(config: &TunnelConfig) -> Result<(), ValidationError> {
    check_host("server", &config.server)?;

    if config.port == 0 {
        return Err(reject("port", "must not be zero"));
    }

    check_auth(&config.auth)?;
    check_host("serverName", &config.server_name)?;
    check_dns(&config.dns)?;

    Ok(())
}
