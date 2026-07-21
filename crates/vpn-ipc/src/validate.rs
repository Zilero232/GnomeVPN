use std::net::IpAddr;

use crate::types::TunnelConfig;

const REALITY_KEY_LEN: usize = 43;

const MAX_SHORT_ID_LEN: usize = 16;

const MAX_HOST_LEN: usize = 253;

const UUID_LEN: usize = 36;

const FINGERPRINTS: [&str; 8] = [
    "chrome", "firefox", "safari", "ios", "android", "edge", "360", "qq",
];

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

fn check_public_key(value: &str) -> Result<(), ValidationError> {
    if value.len() != REALITY_KEY_LEN {
        return Err(reject(
            "publicKey",
            format!("expected {REALITY_KEY_LEN} base64url chars"),
        ));
    }

    let is_base64url = value
        .bytes()
        .all(|byte| byte.is_ascii_alphanumeric() || byte == b'-' || byte == b'_');

    if !is_base64url {
        return Err(reject("publicKey", "not base64url"));
    }

    Ok(())
}

fn check_uuid(value: &str) -> Result<(), ValidationError> {
    uuid::Uuid::try_parse(value)
        .ok()
        .filter(|_| value.len() == UUID_LEN)
        .map(|_| ())
        .ok_or_else(|| reject("userId", "not a uuid"))
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

fn check_short_id(value: &str) -> Result<(), ValidationError> {
    if value.len() > MAX_SHORT_ID_LEN {
        return Err(reject(
            "shortId",
            format!("longer than {MAX_SHORT_ID_LEN} chars"),
        ));
    }

    if !value.len().is_multiple_of(2) {
        return Err(reject("shortId", "must have an even length"));
    }

    if !value.bytes().all(|byte| byte.is_ascii_hexdigit()) {
        return Err(reject("shortId", "not hex"));
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

    check_uuid(&config.user_id)?;
    check_host("serverName", &config.server_name)?;
    check_public_key(&config.public_key)?;

    if let Some(short_id) = &config.short_id {
        check_short_id(short_id)?;
    }

    if !FINGERPRINTS.contains(&config.fingerprint.as_str()) {
        return Err(reject(
            "fingerprint",
            format!("unsupported: {}", config.fingerprint),
        ));
    }

    check_dns(&config.dns)?;

    Ok(())
}
