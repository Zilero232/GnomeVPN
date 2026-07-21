use std::io;
use std::pin::Pin;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::task::{ready, Context, Poll};

use tokio::io::{AsyncRead, AsyncWrite, ReadBuf};
use tun_rs::AsyncDevice;

#[derive(Default)]
pub struct Traffic {
    rx: AtomicU64,
    tx: AtomicU64,
}

impl Traffic {
    pub fn rx(&self) -> u64 {
        self.rx.load(Ordering::Relaxed)
    }

    pub fn tx(&self) -> u64 {
        self.tx.load(Ordering::Relaxed)
    }
}

pub struct TunIo {
    device: AsyncDevice,
    traffic: Arc<Traffic>,
}

impl TunIo {
    pub fn new(device: AsyncDevice) -> (Self, Arc<Traffic>) {
        let traffic = Arc::new(Traffic::default());

        (
            Self {
                device,
                traffic: Arc::clone(&traffic),
            },
            traffic,
        )
    }
}

impl AsyncRead for TunIo {
    fn poll_read(
        self: Pin<&mut Self>,
        cx: &mut Context<'_>,
        buf: &mut ReadBuf<'_>,
    ) -> Poll<io::Result<()>> {
        let read = ready!(self.device.poll_recv(cx, buf.initialize_unfilled()))?;
        buf.advance(read);

        self.traffic.tx.fetch_add(read as u64, Ordering::Relaxed);

        Poll::Ready(Ok(()))
    }
}

impl AsyncWrite for TunIo {
    fn poll_write(
        self: Pin<&mut Self>,
        cx: &mut Context<'_>,
        buf: &[u8],
    ) -> Poll<io::Result<usize>> {
        let written = ready!(self.device.poll_send(cx, buf))?;

        self.traffic.rx.fetch_add(written as u64, Ordering::Relaxed);

        Poll::Ready(Ok(written))
    }

    fn poll_flush(self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<io::Result<()>> {
        Poll::Ready(Ok(()))
    }

    fn poll_shutdown(self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<io::Result<()>> {
        Poll::Ready(Ok(()))
    }
}
