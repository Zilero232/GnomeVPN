pub mod commands;
pub mod engine;
pub mod route;
pub mod state;
pub mod types;

use base64::{engine::general_purpose::STANDARD, Engine};
use types::{TunnelConfig, VpnError};
use x25519_dalek::{PublicKey, StaticSecret};

pub fn parse_keys(config: &TunnelConfig) -> Result<(StaticSecret, PublicKey), VpnError> {
    let priv_bytes = decode_key(&config.private_key)?;
    let pub_bytes = decode_key(&config.server_public_key)?;
    Ok((StaticSecret::from(priv_bytes), PublicKey::from(pub_bytes)))
}

fn decode_key(value: &str) -> Result<[u8; 32], VpnError> {
    let raw = STANDARD
        .decode(value.trim())
        .map_err(|e| VpnError::KeyDecode(e.to_string()))?;
    let arr: [u8; 32] = raw.try_into().map_err(|_| VpnError::KeyLength)?;
    Ok(arr)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn decodes_valid_32_byte_key() {
        let key = STANDARD.encode([7u8; 32]);
        let decoded = decode_key(&key).unwrap();
        assert_eq!(decoded, [7u8; 32]);
    }

    #[test]
    fn rejects_wrong_length_key() {
        let key = STANDARD.encode([1u8; 16]);
        assert!(matches!(decode_key(&key), Err(VpnError::KeyLength)));
    }

    #[test]
    fn debug_output_redacts_private_key() {
        let config = TunnelConfig {
            private_key: "super-secret-key-material".to_string(),
            address: "10.8.0.2/32".to_string(),
            dns: "10.8.0.1".to_string(),
            server_public_key: "server-pub".to_string(),
            endpoint: "de.vesper.example:51820".to_string(),
            allowed_ips: vec!["0.0.0.0/0".to_string()],
            persistent_keepalive: 25,
        };

        let rendered = format!("{:?}", config);

        assert!(!rendered.contains("super-secret-key-material"));
        assert!(rendered.contains("[redacted]"));
        assert!(rendered.contains("10.8.0.2/32"));
    }
}
