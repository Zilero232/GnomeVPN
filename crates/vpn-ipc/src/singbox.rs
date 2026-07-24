use serde::Serialize;

use crate::types::TunnelConfig;

const TUNNEL_NAME: &str = "gnomevpn0";
const TUNNEL_ADDRESS: &str = "10.8.0.2/24";
const MTU: u32 = 1420;
const PROXY_TAG: &str = "proxy";
const DIRECT_TAG: &str = "direct";
const TUNNEL_DNS_TAG: &str = "dns-tunnel";
const LOCAL_DNS_TAG: &str = "dns-local";

#[derive(Serialize)]
struct Log {
    level: String,
    timestamp: bool,
}

#[derive(Serialize)]
struct Inbound {
    #[serde(rename = "type")]
    kind: String,
    tag: String,
    #[serde(rename = "interface_name")]
    interface_name: String,
    address: Vec<String>,
    mtu: u32,
    #[serde(rename = "auto_route")]
    auto_route: bool,
    #[serde(rename = "strict_route")]
    strict_route: bool,
    stack: String,
}

#[derive(Serialize)]
struct Tls {
    enabled: bool,
    #[serde(rename = "server_name")]
    server_name: String,
    insecure: bool,
}

#[derive(Serialize)]
#[serde(untagged)]
enum Outbound {
    Hysteria2 {
        #[serde(rename = "type")]
        kind: String,
        tag: String,
        server: String,
        #[serde(rename = "server_port")]
        server_port: u16,
        password: String,
        tls: Tls,
    },
    Simple {
        #[serde(rename = "type")]
        kind: String,
        tag: String,
    },
}

#[derive(Serialize)]
struct Rule {
    #[serde(skip_serializing_if = "Option::is_none")]
    action: Option<String>,
    #[serde(rename = "process_path", skip_serializing_if = "Vec::is_empty")]
    process_path: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    outbound: Option<String>,
}

#[derive(Serialize)]
struct Route {
    rules: Vec<Rule>,
    #[serde(rename = "final")]
    final_outbound: String,
    #[serde(rename = "auto_detect_interface")]
    auto_detect_interface: bool,
    #[serde(rename = "default_domain_resolver")]
    default_domain_resolver: String,
}

#[derive(Serialize)]
struct DnsServer {
    tag: String,
    #[serde(rename = "type")]
    kind: String,
    #[serde(skip_serializing_if = "String::is_empty")]
    server: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    detour: Option<String>,
}

#[derive(Serialize)]
struct Dns {
    servers: Vec<DnsServer>,
    strategy: String,
}

#[derive(Serialize)]
struct Experimental {
    #[serde(rename = "cache_file")]
    cache_file: CacheFile,
}

#[derive(Serialize)]
struct CacheFile {
    enabled: bool,
    path: String,
}

#[derive(Serialize)]
struct SingboxConfig {
    log: Log,
    dns: Dns,
    inbounds: Vec<Inbound>,
    outbounds: Vec<Outbound>,
    route: Route,
    experimental: Experimental,
}

pub struct SingboxConfigInput<'a> {
    pub config: &'a TunnelConfig,
    pub split_apps: &'a [String],
    pub cache_path: &'a str,
}

fn dns(config: &TunnelConfig) -> Dns {
    let mut servers: Vec<DnsServer> = config
        .dns
        .iter()
        .filter(|entry| !entry.is_empty())
        .enumerate()
        .map(|(index, entry)| DnsServer {
            tag: format!("{TUNNEL_DNS_TAG}-{index}"),
            kind: "udp".to_string(),
            server: entry.clone(),
            detour: Some(PROXY_TAG.to_string()),
        })
        .collect();

    servers.push(DnsServer {
        tag: LOCAL_DNS_TAG.to_string(),
        kind: "local".to_string(),
        server: String::new(),
        detour: None,
    });

    Dns {
        servers,
        strategy: "ipv4_only".to_string(),
    }
}

fn route(split_apps: &[String]) -> Route {
    let mut rules = vec![Rule {
        action: Some("sniff".to_string()),
        process_path: Vec::new(),
        outbound: None,
    }];

    let final_outbound = if split_apps.is_empty() {
        PROXY_TAG
    } else {
        rules.push(Rule {
            action: None,
            process_path: split_apps.to_vec(),
            outbound: Some(PROXY_TAG.to_string()),
        });

        DIRECT_TAG
    };

    Route {
        rules,
        final_outbound: final_outbound.to_string(),
        auto_detect_interface: true,
        default_domain_resolver: LOCAL_DNS_TAG.to_string(),
    }
}

pub fn build_singbox_config(input: SingboxConfigInput<'_>) -> String {
    let SingboxConfigInput {
        config,
        split_apps,
        cache_path,
    } = input;

    let singbox = SingboxConfig {
        log: Log {
            level: "info".to_string(),
            timestamp: true,
        },
        dns: dns(config),
        inbounds: vec![Inbound {
            kind: "tun".to_string(),
            tag: "tun-in".to_string(),
            interface_name: TUNNEL_NAME.to_string(),
            address: vec![TUNNEL_ADDRESS.to_string()],
            mtu: MTU,
            auto_route: true,
            strict_route: false,
            stack: "gvisor".to_string(),
        }],
        outbounds: vec![
            Outbound::Hysteria2 {
                kind: "hysteria2".to_string(),
                tag: PROXY_TAG.to_string(),
                server: config.server.clone(),
                server_port: config.port,
                password: config.auth.clone(),
                tls: Tls {
                    enabled: true,
                    server_name: config.server_name.clone(),
                    insecure: config.insecure,
                },
            },
            Outbound::Simple {
                kind: "direct".to_string(),
                tag: DIRECT_TAG.to_string(),
            },
        ],
        route: route(split_apps),
        experimental: Experimental {
            cache_file: CacheFile {
                enabled: true,
                path: cache_path.to_string(),
            },
        },
    };

    serde_json::to_string_pretty(&singbox).unwrap_or_default()
}
