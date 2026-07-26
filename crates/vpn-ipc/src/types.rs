use std::fmt;

use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct TunnelConfig {
    pub server: String,
    pub port: u16,
    pub auth: String,
    pub server_name: String,
    #[serde(default)]
    pub insecure: bool,
    pub dns: Vec<String>,
}

impl fmt::Debug for TunnelConfig {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("TunnelConfig")
            .field("server", &self.server)
            .field("port", &self.port)
            .field("auth", &"[redacted]")
            .field("server_name", &self.server_name)
            .field("insecure", &self.insecure)
            .field("dns", &self.dns)
            .finish()
    }
}

#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum SplitMode {
    #[default]
    Allowed,
    Disallowed,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SplitConfig {
    #[serde(default)]
    pub apps_mode: SplitMode,
    #[serde(default)]
    pub apps: Vec<String>,
    #[serde(default)]
    pub ips_mode: SplitMode,
    #[serde(default)]
    pub ips: Vec<String>,
}

impl SplitConfig {
    pub fn is_empty(&self) -> bool {
        self.apps.is_empty() && self.ips.is_empty()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum Request {
    Connect {
        config: Box<TunnelConfig>,
        #[serde(default = "default_true")]
        auto_reconnect: bool,
        #[serde(default)]
        split: SplitConfig,
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
