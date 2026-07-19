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

pub fn parse_preshared_key(config: &TunnelConfig) -> Result<Option<[u8; 32]>, VpnError> {
    match config.preshared_key.as_deref() {
        Some(value) if !value.trim().is_empty() => Ok(Some(decode_key(value)?)),
        _ => Ok(None),
    }
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

    fn sample_config(preshared_key: Option<String>) -> TunnelConfig {
        TunnelConfig {
            private_key: "super-secret-key-material".to_string(),
            address: "10.8.0.2/32".to_string(),
            dns: "10.8.0.1".to_string(),
            server_public_key: "server-pub".to_string(),
            preshared_key,
            endpoint: "de.vesper.example:51820".to_string(),
            allowed_ips: vec!["0.0.0.0/0".to_string()],
            persistent_keepalive: 25,
        }
    }

    #[test]
    fn decodes_a_preshared_key_when_the_server_sends_one() {
        let psk = STANDARD.encode([3u8; 32]);
        let parsed = parse_preshared_key(&sample_config(Some(psk))).unwrap();

        assert_eq!(parsed, Some([3u8; 32]));
    }

    #[test]
    fn treats_a_missing_preshared_key_as_none() {
        assert_eq!(parse_preshared_key(&sample_config(None)).unwrap(), None);
    }

    #[test]
    fn treats_an_empty_preshared_key_as_none() {
        let parsed = parse_preshared_key(&sample_config(Some("   ".to_string()))).unwrap();

        assert_eq!(parsed, None);
    }

    #[test]
    fn rejects_a_malformed_preshared_key() {
        let parsed = parse_preshared_key(&sample_config(Some("not-base64!".to_string())));

        assert!(parsed.is_err());
    }

    #[test]
    fn debug_output_redacts_private_key() {
        let psk = STANDARD.encode([9u8; 32]);
        let config = sample_config(Some(psk.clone()));

        let rendered = format!("{:?}", config);

        assert!(!rendered.contains("super-secret-key-material"));
        assert!(!rendered.contains(&psk), "preshared key must not leak into logs");
        assert!(rendered.contains("[redacted]"));
        assert!(rendered.contains("10.8.0.2/32"));
    }
}
