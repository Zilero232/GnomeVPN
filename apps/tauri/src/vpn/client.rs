use std::io::BufReader;
use std::sync::Arc;

use gnomevpn_ipc::{
    read_frame, write_frame, Request, Response, SplitConfig, TunnelConfig, TunnelEvent,
    TunnelStatus, PIPE_NAME, PROTOCOL_VERSION,
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

        client.expect(
            Request::Hello {
                protocol_version: PROTOCOL_VERSION,
            },
            |response| matches!(response, Response::Hello { .. }).then_some(()),
        )?;

        Ok(client)
    }

    fn request(&mut self, request: Request) -> Result<Response, ClientError> {
        write_frame(&mut self.stream, &request)
            .map_err(|e| ClientError::Protocol(e.to_string()))?;

        let mut reader = BufReader::new(&mut self.stream);

        loop {
            let response =
                read_frame(&mut reader).map_err(|e| ClientError::Protocol(e.to_string()))?;

            if !matches!(response, Response::Event { .. }) {
                return Ok(response);
            }
        }
    }

    fn expect<T>(
        &mut self,
        request: Request,
        accept: impl Fn(Response) -> Option<T>,
    ) -> Result<T, ClientError> {
        let response = self.request(request)?;

        if let Response::Error { message } = response {
            return Err(ClientError::Refused(message));
        }

        let unexpected = format!("unexpected reply: {response:?}");

        accept(response).ok_or(ClientError::Protocol(unexpected))
    }

    pub fn connect_tunnel(
        &mut self,
        config: TunnelConfig,
        auto_reconnect: bool,
        split: SplitConfig,
    ) -> Result<(), ClientError> {
        self.expect(
            Request::Connect {
                config: Box::new(config),
                auto_reconnect,
                split,
            },
            |response| matches!(response, Response::Ok).then_some(()),
        )
    }

    pub fn disconnect_tunnel(&mut self) -> Result<(), ClientError> {
        self.expect(Request::Disconnect, |response| {
            matches!(response, Response::Ok).then_some(())
        })
    }

    pub fn status(&mut self) -> Result<TunnelStatus, ClientError> {
        self.expect(Request::Status, |response| match response {
            Response::Status { status } => Some(status),
            _ => None,
        })
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
