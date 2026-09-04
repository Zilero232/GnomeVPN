pub mod frame;
pub mod hysteria;
pub mod latency;
pub mod singbox;
pub mod stall;
pub mod types;
pub mod validate;

pub use frame::{read_frame, write_frame, FrameError, MAX_FRAME_LEN};
pub use hysteria::{build_hysteria_config, SocksCredentials};
pub use latency::{probe_latency, LatencyError};
pub use singbox::{build_singbox_config, SingboxConfigInput};
pub use stall::{StallDetector, Traffic, PROBE_INTERVAL, STALL_MIN_BYTES, STALL_TIMEOUT};
pub use types::{Request, Response, SplitConfig, SplitMode, TunnelConfig, TunnelEvent, TunnelProtocol, TunnelStatus, WireguardConfig};
pub use validate::{validate_split, validate_tunnel_config, ValidationError};

pub const PROTOCOL_VERSION: u32 = 1;

#[cfg(target_os = "windows")]
pub const PIPE_NAME: &str = r"\\.\pipe\gnomevpn-service";

#[cfg(unix)]
pub const SOCKET_DIR: &str = "/var/run/gnomevpn";

#[cfg(unix)]
pub const PIPE_NAME: &str = "/var/run/gnomevpn/service.sock";
