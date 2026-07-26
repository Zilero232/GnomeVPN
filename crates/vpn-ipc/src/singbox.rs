use serde::Serialize;

use crate::types::{SplitConfig, SplitMode, TunnelConfig};

const TUNNEL_NAME: &str = "gnomevpn0";
const TUNNEL_ADDRESS: &str = "10.8.0.2/24";
const MTU: u32 = 1420;
const PROXY_TAG: &str = "proxy";
const DIRECT_TAG: &str = "direct";
const TUNNEL_DNS_TAG: &str = "dns-tunnel";
const LOCAL_DNS_TAG: &str = "dns-local";
const FALLBACK_DNS: &str = "1.1.1.1";
const LOCAL_NETWORKS: [&str; 4] = [
    "127.0.0.0/8",
    "10.0.0.0/8",
    "172.16.0.0/12",
    "192.168.0.0/16",
];

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
    #[serde(rename = "route_exclude_address")]
    route_exclude_address: Vec<String>,
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

#[derive(Serialize, Default)]
struct Rule {
    #[serde(skip_serializing_if = "Option::is_none")]
    action: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    protocol: Option<String>,
    #[serde(rename = "ip_is_private", skip_serializing_if = "Option::is_none")]
    ip_is_private: Option<bool>,
    #[serde(rename = "process_name", skip_serializing_if = "Vec::is_empty")]
    process_name: Vec<String>,
    #[serde(rename = "process_path", skip_serializing_if = "Vec::is_empty")]
    process_path: Vec<String>,
    #[serde(rename = "ip_cidr", skip_serializing_if = "Vec::is_empty")]
    ip_cidr: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    outbound: Option<String>,
}

impl Rule {
    fn sniff() -> Self {
        Rule {
            action: Some("sniff".to_string()),
            ..Default::default()
        }
    }

    fn hijack_dns() -> Self {
        Rule {
            action: Some("hijack-dns".to_string()),
            protocol: Some("dns".to_string()),
            ..Default::default()
        }
    }

    fn private_direct() -> Self {
        Rule {
            action: Some("route".to_string()),
            ip_is_private: Some(true),
            outbound: Some(DIRECT_TAG.to_string()),
            ..Default::default()
        }
    }

    fn app_paths(paths: Vec<String>, outbound: &str) -> Self {
        Rule {
            action: Some("route".to_string()),
            process_path: paths,
            outbound: Some(outbound.to_string()),
            ..Default::default()
        }
    }

    fn app_names(names: Vec<String>, outbound: &str) -> Self {
        Rule {
            action: Some("route".to_string()),
            process_name: names,
            outbound: Some(outbound.to_string()),
            ..Default::default()
        }
    }

    fn ips(cidrs: Vec<String>, outbound: &str) -> Self {
        Rule {
            action: Some("route".to_string()),
            ip_cidr: cidrs,
            outbound: Some(outbound.to_string()),
            ..Default::default()
        }
    }
}

fn process_name_of(path: &str) -> Option<String> {
    path.rsplit(['\\', '/'])
        .next()
        .map(str::to_string)
        .filter(|name| !name.is_empty())
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
struct DnsRule {
    #[serde(skip_serializing_if = "Vec::is_empty")]
    domain: Vec<String>,
    #[serde(rename = "process_name", skip_serializing_if = "Vec::is_empty")]
    process_name: Vec<String>,
    #[serde(rename = "process_path", skip_serializing_if = "Vec::is_empty")]
    process_path: Vec<String>,
    server: String,
}

impl DnsRule {
    fn domain(domains: Vec<String>, server: &str) -> Self {
        DnsRule {
            domain: domains,
            process_name: Vec::new(),
            process_path: Vec::new(),
            server: server.to_string(),
        }
    }

    fn process_paths(paths: Vec<String>, server: &str) -> Self {
        DnsRule {
            domain: Vec::new(),
            process_name: Vec::new(),
            process_path: paths,
            server: server.to_string(),
        }
    }

    fn process_names(names: Vec<String>, server: &str) -> Self {
        DnsRule {
            domain: Vec::new(),
            process_name: names,
            process_path: Vec::new(),
            server: server.to_string(),
        }
    }
}

#[derive(Serialize)]
struct Dns {
    servers: Vec<DnsServer>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    rules: Vec<DnsRule>,
    #[serde(rename = "final")]
    final_server: String,
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
    pub split: &'a SplitConfig,
    pub cache_path: &'a str,
}

fn dns(config: &TunnelConfig, split: &SplitConfig) -> Dns {
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

    if servers.is_empty() {
        servers.push(DnsServer {
            tag: format!("{TUNNEL_DNS_TAG}-0"),
            kind: "udp".to_string(),
            server: FALLBACK_DNS.to_string(),
            detour: Some(PROXY_TAG.to_string()),
        });
    }

    let tunnel_dns = format!("{TUNNEL_DNS_TAG}-0");

    servers.push(DnsServer {
        tag: LOCAL_DNS_TAG.to_string(),
        kind: "local".to_string(),
        server: String::new(),
        detour: None,
    });

    let mut rules = Vec::new();

    if !is_ip_literal(&config.server) {
        rules.push(DnsRule::domain(vec![config.server.clone()], LOCAL_DNS_TAG));
    }

    if !split.apps.is_empty() && split.apps_mode == SplitMode::Disallowed {
        rules.push(DnsRule::process_paths(split.apps.clone(), LOCAL_DNS_TAG));

        let names: Vec<String> = split
            .apps
            .iter()
            .filter_map(|p| process_name_of(p))
            .collect();

        if !names.is_empty() {
            rules.push(DnsRule::process_names(names, LOCAL_DNS_TAG));
        }
    }

    Dns {
        servers,
        rules,
        final_server: tunnel_dns,
        strategy: "ipv4_only".to_string(),
    }
}

fn is_ip_literal(host: &str) -> bool {
    host.parse::<std::net::IpAddr>().is_ok()
}

fn tag_for(mode: SplitMode) -> &'static str {
    match mode {
        SplitMode::Allowed => PROXY_TAG,
        SplitMode::Disallowed => DIRECT_TAG,
    }
}

fn route(split: &SplitConfig) -> Route {
    let mut rules = vec![Rule::sniff(), Rule::hijack_dns(), Rule::private_direct()];

    if !split.apps.is_empty() {
        let outbound = tag_for(split.apps_mode);

        rules.push(Rule::app_paths(split.apps.clone(), outbound));

        let names: Vec<String> = split
            .apps
            .iter()
            .filter_map(|p| process_name_of(p))
            .collect();

        if !names.is_empty() {
            rules.push(Rule::app_names(names, outbound));
        }
    }

    if !split.ips.is_empty() {
        rules.push(Rule::ips(split.ips.clone(), tag_for(split.ips_mode)));
    }

    let has_allowed = (!split.apps.is_empty() && split.apps_mode == SplitMode::Allowed)
        || (!split.ips.is_empty() && split.ips_mode == SplitMode::Allowed);

    let final_outbound = if has_allowed { DIRECT_TAG } else { PROXY_TAG };

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
        split,
        cache_path,
    } = input;

    let singbox = SingboxConfig {
        log: Log {
            level: "info".to_string(),
            timestamp: true,
        },
        dns: dns(config, split),
        inbounds: vec![Inbound {
            kind: "tun".to_string(),
            tag: "tun-in".to_string(),
            interface_name: TUNNEL_NAME.to_string(),
            address: vec![TUNNEL_ADDRESS.to_string()],
            mtu: MTU,
            auto_route: true,
            strict_route: true,
            route_exclude_address: LOCAL_NETWORKS.iter().map(|net| net.to_string()).collect(),
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
        route: route(split),
        experimental: Experimental {
            cache_file: CacheFile {
                enabled: true,
                path: cache_path.to_string(),
            },
        },
    };

    serde_json::to_string_pretty(&singbox).unwrap_or_default()
}
