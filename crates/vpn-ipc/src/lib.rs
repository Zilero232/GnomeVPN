pub mod frame;
pub mod types;
pub mod validate;
pub mod xray;

pub use frame::{read_frame, write_frame, FrameError, MAX_FRAME_LEN};
pub use types::{Request, Response, TunnelConfig, TunnelEvent, TunnelStatus};
pub use validate::{validate_tunnel_config, ValidationError};
pub use xray::{build_xray_config, SocksCredentials, CLIENT_FLOW};

pub const PROTOCOL_VERSION: u32 = 1;

#[cfg(target_os = "windows")]
pub const PIPE_NAME: &str = r"\\.\pipe\gnomevpn-service";
