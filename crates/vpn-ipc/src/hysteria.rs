use std::net::SocketAddr;

use serde::Serialize;

use crate::types::TunnelConfig;

pub struct SocksCredentials {
    pub user: String,
    pub password: String,
}

impl SocksCredentials {
    pub fn generate() -> Result<Self, getrandom::Error> {
        Ok(Self {
            user: token()?,
            password: token()?,
        })
    }
}

fn token() -> Result<String, getrandom::Error> {
    let mut bytes = [0u8; 16];
    getrandom::getrandom(&mut bytes)?;

    Ok(hex::encode(bytes))
}

#[derive(Serialize)]
struct HysteriaTls {
    sni: String,
    insecure: bool,
}

#[derive(Serialize)]
struct HysteriaSocks5 {
    listen: String,
    username: String,
    password: String,
}

#[derive(Serialize)]
struct HysteriaQuic {
    #[serde(rename = "initStreamReceiveWindow")]
    init_stream_receive_window: u32,
    #[serde(rename = "maxStreamReceiveWindow")]
    max_stream_receive_window: u32,
    #[serde(rename = "initConnReceiveWindow")]
    init_conn_receive_window: u32,
    #[serde(rename = "maxConnReceiveWindow")]
    max_conn_receive_window: u32,
    #[serde(rename = "maxIdleTimeout")]
    max_idle_timeout: String,
    #[serde(rename = "keepAlivePeriod")]
    keep_alive_period: String,
    #[serde(rename = "disablePathMTUDiscovery")]
    disable_path_mtu_discovery: bool,
}

#[derive(Serialize)]
struct HysteriaResolverUdp {
    addr: String,
}

#[derive(Serialize)]
struct HysteriaResolver {
    #[serde(rename = "type")]
    kind: String,
    udp: HysteriaResolverUdp,
}

#[derive(Serialize)]
struct HysteriaClientConfig {
    server: String,
    auth: String,
    tls: HysteriaTls,
    socks5: HysteriaSocks5,
    quic: HysteriaQuic,
    #[serde(rename = "fastOpen")]
    fast_open: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    resolver: Option<HysteriaResolver>,
}

pub fn build_hysteria_config(config: &TunnelConfig, socks: SocketAddr, credentials: &SocksCredentials) -> String {
    let resolver = config.dns.iter().find(|entry| !entry.is_empty()).map(|entry| HysteriaResolver {
        kind: "udp".to_string(),
        udp: HysteriaResolverUdp { addr: format!("{entry}:53") },
    });

    let client = HysteriaClientConfig {
        server: format!("{}:{}", config.server, config.port),
        auth: config.auth.clone(),
        tls: HysteriaTls {
            sni: config.server_name.clone(),
            insecure: config.insecure,
        },
        socks5: HysteriaSocks5 {
            listen: socks.to_string(),
            username: credentials.user.clone(),
            password: credentials.password.clone(),
        },
        quic: HysteriaQuic {
            init_stream_receive_window: 8_388_608,
            max_stream_receive_window: 8_388_608,
            init_conn_receive_window: 20_971_520,
            max_conn_receive_window: 20_971_520,
            max_idle_timeout: "120s".to_string(),
            keep_alive_period: "5s".to_string(),
            disable_path_mtu_discovery: true,
        },
        fast_open: true,
        resolver,
    };

    serde_yml::to_string(&client).unwrap_or_default()
}

#[cfg(test)]
mod tests {
    use std::net::{IpAddr, Ipv4Addr};

    use serde_yml::Value;

    use super::*;
    use crate::types::TunnelProtocol;

    fn config() -> TunnelConfig {
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

    fn credentials() -> SocksCredentials {
        SocksCredentials {
            user: "socks-user".to_string(),
            password: "socks-password".to_string(),
        }
    }

    fn socks() -> SocketAddr {
        SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), 1080)
    }

    fn build(config: &TunnelConfig) -> Value {
        let rendered = build_hysteria_config(config, socks(), &credentials());

        serde_yml::from_str(&rendered).expect("valid yaml")
    }

    #[test]
    fn joins_the_server_and_port_into_one_address() {
        let value = build(&config());

        assert_eq!(value["server"].as_str(), Some("203.0.113.10:443"));
    }

    #[test]
    fn carries_the_auth_and_the_sni_through() {
        let value = build(&config());

        assert_eq!(value["auth"].as_str(), Some("peer-password"));
        assert_eq!(value["tls"]["sni"].as_str(), Some("masquerade.example"));
        assert_eq!(value["tls"]["insecure"].as_bool(), Some(true));
    }

    #[test]
    fn listens_for_socks_with_the_given_credentials() {
        let value = build(&config());

        assert_eq!(value["socks5"]["listen"].as_str(), Some("127.0.0.1:1080"));
        assert_eq!(value["socks5"]["username"].as_str(), Some("socks-user"));
        assert_eq!(value["socks5"]["password"].as_str(), Some("socks-password"));
    }

    #[test]
    fn points_the_resolver_at_the_first_dns_entry_on_port_53() {
        let source = TunnelConfig {
            dns: vec![String::new(), "9.9.9.9".to_string(), "1.1.1.1".to_string()],
            ..config()
        };

        let value = build(&source);

        assert_eq!(value["resolver"]["type"].as_str(), Some("udp"));
        assert_eq!(value["resolver"]["udp"]["addr"].as_str(), Some("9.9.9.9:53"));
    }

    #[test]
    fn omits_the_resolver_when_no_dns_entry_is_usable() {
        let source = TunnelConfig {
            dns: vec![String::new()],
            ..config()
        };

        assert!(build(&source).get("resolver").is_none());
    }

    #[test]
    fn generates_a_distinct_hex_token_pair() {
        let first = SocksCredentials::generate().expect("generate");
        let second = SocksCredentials::generate().expect("generate");

        assert_eq!(first.user.len(), 32);
        assert_eq!(first.password.len(), 32);

        assert!(first.user.chars().all(|c| c.is_ascii_hexdigit()));

        assert_ne!(first.user, first.password);
        assert_ne!(first.user, second.user);
    }
}
