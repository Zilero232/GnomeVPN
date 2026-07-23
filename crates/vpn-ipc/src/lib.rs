pub mod frame;
pub mod hysteria;
pub mod latency;
pub mod types;
pub mod validate;

pub use frame::{read_frame, write_frame, FrameError, MAX_FRAME_LEN};
pub use hysteria::{build_hysteria_config, SocksCredentials};
pub use latency::{probe_latency, LatencyError};
pub use types::{Request, Response, TunnelConfig, TunnelEvent, TunnelStatus};
pub use validate::{validate_tunnel_config, ValidationError};

pub const PROTOCOL_VERSION: u32 = 1;

#[cfg(target_os = "windows")]
pub const PIPE_NAME: &str = r"\\.\pipe\gnomevpn-service";
