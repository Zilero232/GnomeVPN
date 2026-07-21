use std::io::{self, BufReader};
use std::path::Path;
use std::sync::Arc;

use gnomevpn_ipc::{read_frame, write_frame, Request, Response, TunnelStatus, PIPE_NAME};
use interprocess::os::windows::named_pipe::{pipe_mode, DuplexPipeStream, PipeListenerOptions};
use interprocess::os::windows::security_descriptor::SecurityDescriptor;
use parking_lot::Mutex;
use tokio::runtime::Handle;
use widestring::U16CString;

use super::session::{handle, Action};
use crate::tunnel::supervisor::Supervisor;

const PIPE_SDDL: &str = "D:(A;;GA;;;SY)(A;;GA;;;BA)(A;;GRGW;;;IU)S:(ML;;NW;;;LW)";

const ORPHAN_GRACE: std::time::Duration = std::time::Duration::from_secs(5);

type PipeStream = DuplexPipeStream<pipe_mode::Bytes>;

type PipeWriter = interprocess::os::windows::named_pipe::SendPipeStream<pipe_mode::Bytes>;

type SharedWriter = Arc<Mutex<PipeWriter>>;

pub fn serve(supervisor: Arc<Supervisor>, runtime: Handle) -> io::Result<()> {
    let listener = listen()?;

    log::info!("listening on {PIPE_NAME}");

    for connection in listener.incoming() {
        let stream = match connection {
            Ok(stream) => stream,
            Err(error) => {
                log::warn!("rejected connection: {error}");
                continue;
            }
        };

        let supervisor = Arc::clone(&supervisor);
        let runtime = runtime.clone();

        std::thread::spawn(move || serve_client(stream, supervisor, runtime));
    }

    Ok(())
}

fn listen() -> io::Result<
    interprocess::os::windows::named_pipe::PipeListener<pipe_mode::Bytes, pipe_mode::Bytes>,
> {
    let sddl = U16CString::from_str(PIPE_SDDL)
        .map_err(|error| io::Error::new(io::ErrorKind::InvalidInput, error.to_string()))?;

    PipeListenerOptions::new()
        .path(Path::new(PIPE_NAME))
        .security_descriptor(Some(SecurityDescriptor::deserialize(&sddl)?))
        .create_duplex::<pipe_mode::Bytes>()
}

fn serve_client(stream: PipeStream, supervisor: Arc<Supervisor>, runtime: Handle) {
    let (reader, writer) = stream.split();
    let writer: SharedWriter = Arc::new(Mutex::new(writer));

    supervisor.client_connected();

    let events = supervisor.subscribe();
    pump_events(events, Arc::clone(&writer));

    if let Err(error) = serve_requests(BufReader::new(reader), &writer, &supervisor, &runtime) {
        log::debug!("client session ended: {error}");
    }

    if supervisor.client_disconnected() {
        watch_for_orphan(Arc::clone(&supervisor), runtime);
    }
}

fn watch_for_orphan(supervisor: Arc<Supervisor>, runtime: Handle) {
    runtime.spawn(async move {
        tokio::time::sleep(ORPHAN_GRACE).await;

        if supervisor.has_clients() || supervisor.status() == TunnelStatus::Disconnected {
            return;
        }

        log::warn!("no client reconnected, stopping the orphaned tunnel");
        supervisor.stop();
    });
}

fn pump_events(
    mut events: tokio::sync::broadcast::Receiver<gnomevpn_ipc::TunnelEvent>,
    writer: SharedWriter,
) {
    std::thread::spawn(move || {
        while let Ok(event) = events.blocking_recv() {
            if write_frame(&mut *writer.lock(), &Response::Event { event }).is_err() {
                return;
            }
        }
    });
}

fn serve_requests(
    mut reader: BufReader<impl std::io::Read>,
    writer: &SharedWriter,
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
            Action::StartTunnel(response, config) => {
                reply(writer, &response)?;
                crate::tunnel::spawn(runtime, Arc::clone(supervisor), *config);
            }
        }
    }
}

fn reply(writer: &SharedWriter, response: &Response) -> io::Result<()> {
    write_frame(&mut *writer.lock(), response).map_err(|error| io::Error::other(error.to_string()))
}
