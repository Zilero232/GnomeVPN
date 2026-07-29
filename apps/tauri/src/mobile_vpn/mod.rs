pub mod commands;
pub mod engine;
pub mod jni;
pub mod plugin;
pub mod state;
pub mod wireguard;

#[derive(Debug, thiserror::Error)]
pub enum MobileVpnError {
    #[error("vpn service error: {0}")]
    Service(String),
    #[error("hysteria error: {0}")]
    Hysteria(String),
    #[error("tunnel error: {0}")]
    Tunnel(String),
    #[error("wireguard error: {0}")]
    Wireguard(String),
}

impl serde::Serialize for MobileVpnError {
    fn serialize<S: serde::Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(&self.to_string())
    }
}
