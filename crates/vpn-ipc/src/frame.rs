use std::io::{self, Read, Write};

use serde::de::DeserializeOwned;
use serde::Serialize;

pub const MAX_FRAME_LEN: u32 = 64 * 1024;

#[derive(Debug, thiserror::Error)]
pub enum FrameError {
    #[error("io error: {0}")]
    Io(#[from] io::Error),
    #[error("frame too large: {0} bytes (max {MAX_FRAME_LEN})")]
    TooLarge(u32),
    #[error("malformed payload: {0}")]
    Payload(String),
}

pub fn write_frame<W: Write, T: Serialize>(writer: &mut W, value: &T) -> Result<(), FrameError> {
    let payload = serde_json::to_vec(value).map_err(|e| FrameError::Payload(e.to_string()))?;

    let len = u32::try_from(payload.len()).map_err(|_| FrameError::TooLarge(u32::MAX)).and_then(|len| {
        if len > MAX_FRAME_LEN {
            Err(FrameError::TooLarge(len))
        } else {
            Ok(len)
        }
    })?;

    writer.write_all(&len.to_be_bytes())?;
    writer.write_all(&payload)?;
    writer.flush()?;

    Ok(())
}

pub fn read_frame<R: Read, T: DeserializeOwned>(reader: &mut R) -> Result<T, FrameError> {
    let mut len_buf = [0u8; 4];
    reader.read_exact(&mut len_buf)?;

    let len = u32::from_be_bytes(len_buf);

    if len > MAX_FRAME_LEN {
        return Err(FrameError::TooLarge(len));
    }

    let mut payload = vec![0u8; len as usize];
    reader.read_exact(&mut payload)?;

    serde_json::from_slice(&payload).map_err(|e| FrameError::Payload(e.to_string()))
}

#[cfg(test)]
mod tests {
    use std::io::Cursor;

    use super::*;
    use crate::types::{Request, Response, SplitConfig, TunnelConfig, TunnelProtocol, TunnelStatus};

    fn roundtrip<T: Serialize + DeserializeOwned>(value: &T) -> T {
        let mut buffer = Vec::new();

        write_frame(&mut buffer, value).expect("write");

        read_frame(&mut Cursor::new(buffer)).expect("read")
    }

    #[test]
    fn writes_a_big_endian_length_prefix_before_the_payload() {
        let mut buffer = Vec::new();

        write_frame(&mut buffer, &Response::Ok).expect("write");

        let payload = serde_json::to_vec(&Response::Ok).unwrap();
        let len = u32::try_from(payload.len()).unwrap();

        assert_eq!(&buffer[..4], &len.to_be_bytes());
        assert_eq!(&buffer[4..], payload.as_slice());
    }

    #[test]
    fn round_trips_a_request() {
        let request = Request::Connect {
            config: Box::new(TunnelConfig {
                protocol: TunnelProtocol::Hysteria2,
                server: "203.0.113.10".to_string(),
                port: 443,
                auth: "peer-password".to_string(),
                server_name: "masquerade.example".to_string(),
                insecure: true,
                dns: vec!["1.1.1.1".to_string()],
                wireguard: None,
            }),
            auto_reconnect: false,
            split: SplitConfig::default(),
        };

        assert_eq!(roundtrip(&request), request);
    }

    #[test]
    fn round_trips_a_response() {
        let response = Response::Status {
            status: TunnelStatus::Connected,
        };

        assert_eq!(roundtrip(&response), response);
    }

    #[test]
    fn reads_frames_back_to_back_from_one_stream() {
        let mut buffer = Vec::new();

        write_frame(&mut buffer, &Response::Ok).expect("first");
        write_frame(&mut buffer, &Response::Hello { protocol_version: 1 }).expect("second");

        let mut cursor = Cursor::new(buffer);

        assert_eq!(read_frame::<_, Response>(&mut cursor).unwrap(), Response::Ok);
        assert_eq!(read_frame::<_, Response>(&mut cursor).unwrap(), Response::Hello { protocol_version: 1 });
    }

    #[test]
    fn refuses_to_write_a_payload_over_the_limit() {
        let oversized = "x".repeat(MAX_FRAME_LEN as usize + 1);

        let error = write_frame(&mut Vec::new(), &oversized).expect_err("must reject");

        assert!(matches!(error, FrameError::TooLarge(_)));
    }

    #[test]
    fn refuses_to_read_a_length_prefix_over_the_limit() {
        let mut buffer = (MAX_FRAME_LEN + 1).to_be_bytes().to_vec();
        buffer.extend_from_slice(b"{}");

        let error = read_frame::<_, Response>(&mut Cursor::new(buffer)).expect_err("must reject");

        assert!(matches!(error, FrameError::TooLarge(len) if len == MAX_FRAME_LEN + 1));
    }

    #[test]
    fn reports_a_malformed_payload_rather_than_panicking() {
        let payload = b"not json";

        let mut buffer = u32::try_from(payload.len()).unwrap().to_be_bytes().to_vec();
        buffer.extend_from_slice(payload);

        let error = read_frame::<_, Response>(&mut Cursor::new(buffer)).expect_err("must reject");

        assert!(matches!(error, FrameError::Payload(_)));
    }

    #[test]
    fn reports_io_when_the_stream_ends_mid_frame() {
        let buffer = 32u32.to_be_bytes().to_vec();

        let error = read_frame::<_, Response>(&mut Cursor::new(buffer)).expect_err("must reject");

        assert!(matches!(error, FrameError::Io(_)));
    }
}
