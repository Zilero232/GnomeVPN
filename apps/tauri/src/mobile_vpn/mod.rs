pub mod commands;
pub mod engine;
pub mod plugin;
pub mod state;

#[derive(Debug, thiserror::Error)]
pub enum MobileVpnError {
    #[error("vpn service error: {0}")]
    Service(String),
    #[error("xray error: {0}")]
    Xray(String),
    #[error("tunnel error: {0}")]
    Tunnel(String),
}

impl serde::Serialize for MobileVpnError {
    fn serialize<S: serde::Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(&self.to_string())
    }
}
