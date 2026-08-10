use std::fs;
use std::io::{self, BufReader};
use std::os::unix::fs::PermissionsExt;
use std::os::unix::net::UnixStream;
use std::path::Path;
use std::sync::Arc;

use gnomevpn_ipc::{PIPE_NAME, SOCKET_DIR};
use parking_lot::Mutex;
use tokio::net::UnixListener;
use tokio::runtime::Handle;

use super::shared::{pump_events, serve_requests, watch_for_orphan, SharedWriter};
use crate::tunnel::supervisor::Supervisor;

#[cfg(target_os = "linux")]
const FIRST_HUMAN_UID: u32 = 1000;

#[cfg(not(target_os = "linux"))]
const FIRST_HUMAN_UID: u32 = 500;

pub fn serve(supervisor: Arc<Supervisor>, runtime: Handle) -> io::Result<()> {
    runtime.clone().block_on(accept_loop(supervisor, runtime))
}

async fn accept_loop(supervisor: Arc<Supervisor>, runtime: Handle) -> io::Result<()> {
    let listener = bind()?;

    log::info!("listening on {PIPE_NAME}");

    loop {
        let stream = match listener.accept().await {
            Ok((stream, _)) => stream,
            Err(error) => {
                log::warn!("rejected connection: {error}");
                continue;
            }
        };

        if !authorized(&stream) {
            continue;
        }

        let stream = match stream.into_std().and_then(|stream| {
            stream.set_nonblocking(false)?;

            Ok(stream)
        }) {
            Ok(stream) => stream,
            Err(error) => {
                log::warn!("cannot take client stream: {error}");
                continue;
            }
        };

        let supervisor = Arc::clone(&supervisor);
        let runtime = runtime.clone();

        std::thread::spawn(move || serve_client(stream, supervisor, runtime));
    }
}

fn authorized(stream: &tokio::net::UnixStream) -> bool {
    match stream.peer_cred() {
        Ok(credentials) => {
            let uid = credentials.uid();

            if uid == 0 || uid >= FIRST_HUMAN_UID {
                log::debug!("accepted client uid={uid}");

                return true;
            }

            log::warn!("rejected client uid={uid}: service accounts cannot control the tunnel");

            false
        }
        Err(error) => {
            log::warn!("rejected client with unreadable credentials: {error}");

            false
        }
    }
}

fn bind() -> io::Result<UnixListener> {
    fs::create_dir_all(SOCKET_DIR)?;
    fs::set_permissions(SOCKET_DIR, fs::Permissions::from_mode(0o755))?;

    if Path::new(PIPE_NAME).exists() {
        fs::remove_file(PIPE_NAME)?;
    }

    let listener = UnixListener::bind(PIPE_NAME)?;

    fs::set_permissions(PIPE_NAME, fs::Permissions::from_mode(0o666))?;

    Ok(listener)
}

fn serve_client(stream: UnixStream, supervisor: Arc<Supervisor>, runtime: Handle) {
    let reader = match stream.try_clone() {
        Ok(reader) => reader,
        Err(error) => {
            log::warn!("cannot split client stream: {error}");

            return;
        }
    };

    let writer: SharedWriter<UnixStream> = Arc::new(Mutex::new(stream));

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
