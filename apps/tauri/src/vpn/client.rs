use std::io::BufReader;
use std::sync::Arc;

use gnomevpn_ipc::{
    read_frame, write_frame, Request, Response, TunnelConfig, TunnelEvent, TunnelStatus, PIPE_NAME,
    PROTOCOL_VERSION,
};
use interprocess::os::windows::named_pipe::{pipe_mode, DuplexPipeStream};

#[derive(Debug, thiserror::Error)]
pub enum ClientError {
    #[error("service is not running: {0}")]
    Unavailable(String),
    #[error("service refused the request: {0}")]
    Refused(String),
    #[error("protocol error: {0}")]
    Protocol(String),
}

impl serde::Serialize for ClientError {
    fn serialize<S: serde::Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(&self.to_string())
    }
}

pub struct ServiceClient {
    stream: DuplexPipeStream<pipe_mode::Bytes>,
}

impl ServiceClient {
    pub fn connect() -> Result<Self, ClientError> {
        let stream = DuplexPipeStream::<pipe_mode::Bytes>::connect_by_path(PIPE_NAME)
            .map_err(|e| ClientError::Unavailable(e.to_string()))?;

        let mut client = Self { stream };

        match client.request(Request::Hello {
            protocol_version: PROTOCOL_VERSION,
        })? {
            Response::Hello { .. } => Ok(client),
            Response::Error { message } => Err(ClientError::Refused(message)),
            other => Err(ClientError::Protocol(format!(
                "unexpected reply: {other:?}"
            ))),
        }
    }

    fn request(&mut self, request: Request) -> Result<Response, ClientError> {
        write_frame(&mut self.stream, &request)
            .map_err(|e| ClientError::Protocol(e.to_string()))?;

        let mut reader = BufReader::new(&mut self.stream);

        read_frame(&mut reader).map_err(|e| ClientError::Protocol(e.to_string()))
    }

    pub fn connect_tunnel(
        &mut self,
        config: TunnelConfig,
        kill_switch: bool,
        auto_reconnect: bool,
    ) -> Result<(), ClientError> {
        match self.request(Request::Connect {
            config: Box::new(config),
            kill_switch,
            auto_reconnect,
        })? {
            Response::Ok => Ok(()),
            Response::Error { message } => Err(ClientError::Refused(message)),
            other => Err(ClientError::Protocol(format!(
                "unexpected reply: {other:?}"
            ))),
        }
    }

    pub fn disconnect_tunnel(&mut self) -> Result<(), ClientError> {
        match self.request(Request::Disconnect)? {
            Response::Ok => Ok(()),
            Response::Error { message } => Err(ClientError::Refused(message)),
            other => Err(ClientError::Protocol(format!(
                "unexpected reply: {other:?}"
            ))),
        }
    }

    pub fn status(&mut self) -> Result<TunnelStatus, ClientError> {
        match self.request(Request::Status)? {
            Response::Status { status } => Ok(status),
            Response::Error { message } => Err(ClientError::Refused(message)),
            other => Err(ClientError::Protocol(format!(
                "unexpected reply: {other:?}"
            ))),
        }
    }

    pub fn pump_events(mut self, on_event: Arc<dyn Fn(TunnelEvent) + Send + Sync>) {
        let mut reader = BufReader::new(&mut self.stream);

        loop {
            match read_frame::<_, Response>(&mut reader) {
                Ok(Response::Event { event }) => on_event(event),
                Ok(_) => continue,
                Err(error) => {
                    log::debug!("event stream closed: {error}");

                    on_event(TunnelEvent::Disconnected);
                    return;
                }
            }
        }
    }
}
