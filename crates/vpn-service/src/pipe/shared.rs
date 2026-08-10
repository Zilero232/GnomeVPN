use std::io::{self, BufReader, Read, Write};
use std::sync::Arc;

use gnomevpn_ipc::{read_frame, write_frame, Request, Response, TunnelEvent, TunnelStatus};
use parking_lot::Mutex;
use tokio::runtime::Handle;
use tokio::sync::broadcast::Receiver;

use super::session::{handle, Action};
use crate::tunnel::supervisor::Supervisor;

const ORPHAN_GRACE: std::time::Duration = std::time::Duration::from_secs(5);

pub type SharedWriter<W> = Arc<Mutex<W>>;

pub fn watch_for_orphan(supervisor: Arc<Supervisor>, runtime: Handle) {
    runtime.spawn(async move {
        tokio::time::sleep(ORPHAN_GRACE).await;

        if supervisor.has_clients() || supervisor.status() == TunnelStatus::Disconnected {
            return;
        }

        log::warn!("no client reconnected, stopping the orphaned tunnel");
        supervisor.stop();
    });
}

pub fn pump_events<W: Write + Send + 'static>(mut events: Receiver<TunnelEvent>, writer: SharedWriter<W>) {
    std::thread::spawn(move || {
        while let Ok(event) = events.blocking_recv() {
            if write_frame(&mut *writer.lock(), &Response::Event { event }).is_err() {
                return;
            }
        }
    });
}

pub fn serve_requests<R: Read, W: Write>(
    mut reader: BufReader<R>,
    writer: &SharedWriter<W>,
    supervisor: &Arc<Supervisor>,
    runtime: &Handle,
) -> io::Result<()> {
    loop {
        let Ok(request) = read_frame::<_, Request>(&mut reader) else {
            return Ok(());
        };

        match handle(request, supervisor) {
            Action::Reply(response) => reply(writer, &response)?,
            Action::Reject(response) => {
                let _ = reply(writer, &response);

                return Ok(());
            }
            Action::StartTunnel(response, config, split) => {
                reply(writer, &response)?;
                crate::tunnel::spawn(runtime, Arc::clone(supervisor), *config, split);
            }
        }
    }
}

fn reply<W: Write>(writer: &SharedWriter<W>, response: &Response) -> io::Result<()> {
    write_frame(&mut *writer.lock(), response).map_err(|error| io::Error::other(error.to_string()))
}
