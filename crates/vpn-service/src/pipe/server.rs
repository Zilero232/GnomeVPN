use std::io::{self, BufReader};
use std::path::Path;
use std::sync::Arc;

use gnomevpn_ipc::PIPE_NAME;
use interprocess::os::windows::named_pipe::{pipe_mode, DuplexPipeStream, PipeListenerOptions};
use interprocess::os::windows::security_descriptor::SecurityDescriptor;
use parking_lot::Mutex;
use tokio::runtime::Handle;
use widestring::U16CString;

use super::shared::{pump_events, serve_requests, watch_for_orphan, SharedWriter};
use crate::tunnel::supervisor::Supervisor;

const PIPE_SDDL: &str = "D:(A;;GA;;;SY)(A;;GA;;;BA)(A;;GRGW;;;IU)S:(ML;;NW;;;LW)";

type PipeStream = DuplexPipeStream<pipe_mode::Bytes>;

type PipeWriter = interprocess::os::windows::named_pipe::SendPipeStream<pipe_mode::Bytes>;

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

fn listen() -> io::Result<interprocess::os::windows::named_pipe::PipeListener<pipe_mode::Bytes, pipe_mode::Bytes>> {
    let sddl = U16CString::from_str(PIPE_SDDL).map_err(|error| io::Error::new(io::ErrorKind::InvalidInput, error.to_string()))?;

    PipeListenerOptions::new()
        .path(Path::new(PIPE_NAME))
        .security_descriptor(Some(SecurityDescriptor::deserialize(&sddl)?))
        .create_duplex::<pipe_mode::Bytes>()
}

fn serve_client(stream: PipeStream, supervisor: Arc<Supervisor>, runtime: Handle) {
    let (reader, writer) = stream.split();
    let writer: SharedWriter<PipeWriter> = Arc::new(Mutex::new(writer));

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
