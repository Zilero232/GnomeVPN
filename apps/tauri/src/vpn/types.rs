use serde::{Deserialize, Serialize};
use std::fmt;

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TunnelConfig {
    pub private_key: String,
    pub address: String,
    pub dns: String,
    pub server_public_key: String,
    #[serde(default)]
    pub preshared_key: Option<String>,
    pub endpoint: String,
    pub allowed_ips: Vec<String>,
    pub persistent_keepalive: u16,
}

impl fmt::Debug for TunnelConfig {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("TunnelConfig")
            .field("private_key", &"[redacted]")
            .field("address", &self.address)
            .field("dns", &self.dns)
            .field("server_public_key", &self.server_public_key)
            .field(
                "preshared_key",
                &self.preshared_key.as_ref().map(|_| "[redacted]"),
            )
            .field("endpoint", &self.endpoint)
            .field("allowed_ips", &self.allowed_ips)
            .field("persistent_keepalive", &self.persistent_keepalive)
            .finish()
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum VpnEvent {
    Connecting,
    Handshake,
    Connected { assigned_ip: String },
    BytesUpdate { rx: u64, tx: u64 },
    Disconnected,
    Error { message: String },
}

#[derive(Debug, thiserror::Error)]
pub enum VpnError {
    #[error("invalid base64 key: {0}")]
    KeyDecode(String),
    #[error("invalid key length")]
    KeyLength,
    #[error("invalid endpoint: {0}")]
    Endpoint(String),
    #[error("tun device error: {0}")]
    Tun(String),
    #[error("io error: {0}")]
    Io(String),
    #[error("already connected")]
    AlreadyConnected,
}

impl serde::Serialize for VpnError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}
