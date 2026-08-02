use std::fmt;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum TunnelProtocol {
    #[default]
    Hysteria2,
    Wireguard,
}

impl TunnelProtocol {
    pub fn tag(self) -> &'static str {
        match self {
            TunnelProtocol::Hysteria2 => "hysteria2",
            TunnelProtocol::Wireguard => "wireguard",
        }
    }
}

#[derive(Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct WireguardConfig {
    pub private_key: String,
    pub address: String,
    pub peer_public_key: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub pre_shared_key: Option<String>,
    #[serde(default)]
    pub allowed_ips: Vec<String>,
    #[serde(default)]
    pub reserved: Vec<u8>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub mtu: Option<u32>,
}

impl fmt::Debug for WireguardConfig {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("WireguardConfig")
            .field("private_key", &"[redacted]")
            .field("address", &self.address)
            .field("peer_public_key", &self.peer_public_key)
            .field("pre_shared_key", &self.pre_shared_key.as_ref().map(|_| "[redacted]"))
            .field("allowed_ips", &self.allowed_ips)
            .field("reserved", &self.reserved)
            .field("mtu", &self.mtu)
            .finish()
    }
}

#[derive(Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct TunnelConfig {
    #[serde(default)]
    pub protocol: TunnelProtocol,
    pub server: String,
    pub port: u16,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub port_range: Option<PortRange>,
    #[serde(default)]
    pub auth: String,
    #[serde(default)]
    pub server_name: String,
    #[serde(default)]
    pub insecure: bool,
    pub dns: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub wireguard: Option<WireguardConfig>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct PortRange {
    pub from: u16,
    pub to: u16,
}

impl PortRange {
    pub fn is_valid(&self) -> bool {
        self.from > 0 && self.from < self.to
    }
}

impl fmt::Debug for TunnelConfig {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("TunnelConfig")
            .field("protocol", &self.protocol)
            .field("server", &self.server)
            .field("port", &self.port)
            .field("port_range", &self.port_range)
            .field("auth", &"[redacted]")
            .field("server_name", &self.server_name)
            .field("insecure", &self.insecure)
            .field("dns", &self.dns)
            .field("wireguard", &self.wireguard)
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
