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

impl fmt::Debug for TunnelConfig {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("TunnelConfig")
            .field("protocol", &self.protocol)
            .field("server", &self.server)
            .field("port", &self.port)
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

#[cfg(test)]
mod tests {
    use super::*;

    fn wireguard() -> WireguardConfig {
        WireguardConfig {
            private_key: "super-secret-private-key".to_string(),
            address: "10.0.0.2/32".to_string(),
            peer_public_key: "peer-public-key".to_string(),
            pre_shared_key: Some("super-secret-shared-key".to_string()),
            allowed_ips: vec!["0.0.0.0/0".to_string()],
            reserved: Vec::new(),
            mtu: Some(1420),
        }
    }

    fn config() -> TunnelConfig {
        TunnelConfig {
            protocol: TunnelProtocol::Hysteria2,
            server: "203.0.113.10".to_string(),
            port: 443,
            auth: "super-secret-auth".to_string(),
            server_name: "masquerade.example".to_string(),
            insecure: true,
            dns: vec!["1.1.1.1".to_string()],
            wireguard: None,
        }
    }

    #[test]
    fn keeps_the_tunnel_auth_out_of_the_debug_output() {
        let rendered = format!("{:?}", config());

        assert!(!rendered.contains("super-secret-auth"));
        assert!(rendered.contains("[redacted]"));
        assert!(rendered.contains("203.0.113.10"));
    }

    #[test]
    fn keeps_the_wireguard_keys_out_of_the_debug_output() {
        let rendered = format!("{:?}", wireguard());

        assert!(!rendered.contains("super-secret-private-key"));
        assert!(!rendered.contains("super-secret-shared-key"));
        assert!(rendered.contains("peer-public-key"));
        assert!(rendered.contains("10.0.0.2/32"));
    }

    #[test]
    fn tags_each_protocol_with_its_singbox_name() {
        assert_eq!(TunnelProtocol::Hysteria2.tag(), "hysteria2");
        assert_eq!(TunnelProtocol::Wireguard.tag(), "wireguard");
    }

    #[test]
    fn defaults_to_hysteria_when_the_protocol_is_absent() {
        let request: Request =
            serde_json::from_str(r#"{"type":"connect","config":{"server":"203.0.113.10","port":443,"dns":["1.1.1.1"]}}"#).expect("parse");

        let Request::Connect {
            config,
            auto_reconnect,
            split,
        } = request
        else {
            panic!("expected a connect request");
        };

        assert_eq!(config.protocol, TunnelProtocol::Hysteria2);
        assert!(auto_reconnect);
        assert!(split.is_empty());
    }

    #[test]
    fn serialises_the_protocol_in_camel_case() {
        let json = serde_json::to_string(&TunnelProtocol::Wireguard).expect("serialise");

        assert_eq!(json, r#""wireguard""#);
    }

    #[test]
    fn round_trips_every_tunnel_event() {
        let events = [
            TunnelEvent::Connecting,
            TunnelEvent::Handshake,
            TunnelEvent::Connected {
                assigned_ip: "10.0.0.2".to_string(),
            },
            TunnelEvent::BytesUpdate { rx: 1, tx: 2 },
            TunnelEvent::Disconnected,
            TunnelEvent::Error { message: "boom".to_string() },
        ];

        for event in events {
            let json = serde_json::to_string(&event).expect("serialise");
            let parsed: TunnelEvent = serde_json::from_str(&json).expect("parse");

            assert_eq!(parsed, event);
        }
    }

    #[test]
    fn counts_a_split_config_as_empty_only_without_apps_and_ips() {
        assert!(SplitConfig::default().is_empty());

        let with_apps = SplitConfig {
            apps: vec!["/usr/bin/firefox".to_string()],
            ..SplitConfig::default()
        };

        assert!(!with_apps.is_empty());

        let with_ips = SplitConfig {
            ips: vec!["10.0.0.0/8".to_string()],
            ..SplitConfig::default()
        };

        assert!(!with_ips.is_empty());
    }
}
