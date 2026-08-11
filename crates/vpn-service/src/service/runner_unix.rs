use std::sync::Arc;

use crate::pipe::uds;
use crate::tunnel::supervisor::Supervisor;

const TEARDOWN_GRACE: std::time::Duration = std::time::Duration::from_secs(5);
const TEARDOWN_POLL: std::time::Duration = std::time::Duration::from_millis(100);

pub fn start() -> Result<(), Box<dyn std::error::Error>> {
    super::init_logging(&log_dir());

    log::info!("gnomevpn-service starting");

    let runtime = tokio::runtime::Runtime::new()?;
    let supervisor = Arc::new(Supervisor::new());

    watch_signals(&runtime, Arc::clone(&supervisor));

    let result = uds::serve(Arc::clone(&supervisor), runtime.handle().clone());

    runtime.block_on(crate::tunnel::singbox::reap_orphans());

    if let Err(error) = result {
        log::error!("socket server stopped: {error}");

        return Err(error.into());
    }

    log::info!("gnomevpn-service stopped");

    Ok(())
}

async fn unwind(supervisor: &Supervisor) {
    supervisor.stop();

    let settled = tokio::time::timeout(TEARDOWN_GRACE, async {
        while supervisor.status() != gnomevpn_ipc::TunnelStatus::Disconnected {
            tokio::time::sleep(TEARDOWN_POLL).await;
        }
    })
    .await;

    if settled.is_err() {
        log::warn!("tunnel did not unwind within {TEARDOWN_GRACE:?}; killing sing-box anyway");
    }

    crate::tunnel::singbox::reap_orphans().await;
}

fn watch_signals(runtime: &tokio::runtime::Runtime, supervisor: Arc<Supervisor>) {
    runtime.spawn(async move {
        use tokio::signal::unix::{signal, SignalKind};

        let Ok(mut terminate) = signal(SignalKind::terminate()) else {
            return;
        };

        let Ok(mut interrupt) = signal(SignalKind::interrupt()) else {
            return;
        };

        tokio::select! {
            _ = terminate.recv() => log::info!("SIGTERM received"),
            _ = interrupt.recv() => log::info!("SIGINT received"),
        }

        unwind(&supervisor).await;

        std::process::exit(0);
    });
}

fn log_dir() -> std::path::PathBuf {
    if cfg!(target_os = "macos") {
        std::path::PathBuf::from("/Library/Logs/GnomeVPN")
    } else {
        std::path::PathBuf::from("/var/log/gnomevpn")
    }
}
