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

pub fn build_hysteria_config(
    config: &TunnelConfig,
    socks: SocketAddr,
    credentials: &SocksCredentials,
) -> String {
    let resolver = config
        .dns
        .iter()
        .find(|entry| !entry.is_empty())
        .map(|entry| HysteriaResolver {
            kind: "udp".to_string(),
            udp: HysteriaResolverUdp {
                addr: format!("{entry}:53"),
            },
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
            max_idle_timeout: "30s".to_string(),
            keep_alive_period: "10s".to_string(),
        },
        fast_open: true,
        resolver,
    };

    serde_yml::to_string(&client).unwrap_or_default()
}
