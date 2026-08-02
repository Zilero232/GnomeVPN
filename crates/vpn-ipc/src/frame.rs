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
