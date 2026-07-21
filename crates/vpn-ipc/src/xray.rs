use std::net::SocketAddr;

use serde_json::json;

use crate::types::TunnelConfig;

pub const CLIENT_FLOW: &str = "xtls-rprx-vision";

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

pub fn build_xray_config(
    config: &TunnelConfig,
    socks: SocketAddr,
    credentials: &SocksCredentials,
) -> String {
    let reality = json!({
        "serverName": config.server_name,
        "publicKey": config.public_key,
        "shortId": config.short_id.clone().unwrap_or_default(),
        "fingerprint": config.fingerprint,
    });

    json!({
        "log": { "loglevel": "warning" },
        "inbounds": [{
            "listen": socks.ip().to_string(),
            "port": socks.port(),
            "protocol": "socks",
            "settings": {
                "udp": true,
                "auth": "password",
                "accounts": [{
                    "user": credentials.user,
                    "pass": credentials.password,
                }],
            },
        }],
        "outbounds": [{
            "protocol": "vless",
            "settings": {
                "vnext": [{
                    "address": config.server,
                    "port": config.port,
                    "users": [{
                        "id": config.user_id,
                        "encryption": "none",
                        "flow": CLIENT_FLOW,
                    }],
                }],
            },
            "streamSettings": {
                "network": "tcp",
                "security": "reality",
                "realitySettings": reality,
            },
        }],
    })
    .to_string()
}
