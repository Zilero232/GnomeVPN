use std::fmt;

use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize, PartialEq, Eq)]
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

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum Request {
    Connect {
        config: Box<TunnelConfig>,
        #[serde(default)]
        kill_switch: bool,
        #[serde(default = "default_true")]
        auto_reconnect: bool,
    },
    Disconnect,
    Status,
    Hello {
        protocol_version: u32,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum Response {
    Ok,
    Status { status: TunnelStatus },
    Event { event: TunnelEvent },
    Error { message: String },
    Hello { protocol_version: u32 },
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum TunnelStatus {
    Disconnected,
    Connecting,
    Connected,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum TunnelEvent {
    Connecting,
    Handshake,
    Connected { assigned_ip: String },
    BytesUpdate { rx: u64, tx: u64 },
    Disconnected,
    Error { message: String },
}

fn default_true() -> bool {
    true
}
