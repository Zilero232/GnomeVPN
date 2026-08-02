use std::ffi::OsString;
use std::sync::Arc;
use std::time::Duration;

use windows_service::service::{ServiceControl, ServiceControlAccept, ServiceExitCode, ServiceState, ServiceStatus, ServiceType};
use windows_service::service_control_handler::{self, ServiceControlHandlerResult};
use windows_service::{define_windows_service, service_dispatcher};

use super::SERVICE_NAME;
use crate::pipe::server;
use crate::tunnel::supervisor::Supervisor;

define_windows_service!(ffi_service_main, service_main);

pub fn start() -> Result<(), Box<dyn std::error::Error>> {
    init_logging();

    match service_dispatcher::start(SERVICE_NAME, ffi_service_main) {
        Ok(()) => Ok(()),
        Err(_) => {
            log::info!("running in console mode");
            run_pipe_server();
            Ok(())
        }
    }
}

fn service_main(_arguments: Vec<OsString>) {
    if let Err(error) = run_as_service() {
        log::error!("service failed: {error}");
    }
}

fn run_as_service() -> Result<(), Box<dyn std::error::Error>> {
    let (shutdown_tx, shutdown_rx) = std::sync::mpsc::channel();

    let handler = move |control| match control {
        ServiceControl::Stop | ServiceControl::Shutdown => {
            let _ = shutdown_tx.send(());
            ServiceControlHandlerResult::NoError
        }
        ServiceControl::Interrogate => ServiceControlHandlerResult::NoError,
        _ => ServiceControlHandlerResult::NotImplemented,
    };

    let status_handle = service_control_handler::register(SERVICE_NAME, handler)?;

    let running = ServiceStatus {
        service_type: ServiceType::OWN_PROCESS,
        current_state: ServiceState::Running,
        controls_accepted: ServiceControlAccept::STOP | ServiceControlAccept::SHUTDOWN,
        exit_code: ServiceExitCode::Win32(0),
        checkpoint: 0,
        wait_hint: Duration::default(),
        process_id: None,
    };

    status_handle.set_service_status(running.clone())?;

    std::thread::spawn(run_pipe_server);

    let _ = shutdown_rx.recv();

    if let Ok(runtime) = tokio::runtime::Runtime::new() {
        runtime.block_on(crate::tunnel::singbox::reap_orphans());
    }

    status_handle.set_service_status(ServiceStatus {
        current_state: ServiceState::Stopped,
        controls_accepted: ServiceControlAccept::empty(),
        ..running
    })?;

    Ok(())
}

fn run_pipe_server() {
    let runtime = match tokio::runtime::Runtime::new() {
        Ok(runtime) => runtime,
        Err(error) => {
            log::error!("failed to start tokio runtime: {error}");
            return;
        }
    };

    let supervisor = Arc::new(Supervisor::new());

    if let Err(error) = server::serve(supervisor, runtime.handle().clone()) {
        log::error!("pipe server stopped: {error}");
    }
}

fn init_logging() {
    use simplelog::{ColorChoice, CombinedLogger, LevelFilter, TermLogger, TerminalMode, WriteLogger};

    let log_dir = std::path::PathBuf::from(std::env::var("ProgramData").unwrap_or_else(|_| r"C:\ProgramData".to_string())).join("GnomeVPN");

    let _ = std::fs::create_dir_all(&log_dir);

    let config = simplelog::Config::default();
    let mut loggers: Vec<Box<dyn simplelog::SharedLogger>> = Vec::new();

    if let Ok(file) = std::fs::OpenOptions::new().create(true).append(true).open(log_dir.join("service.log")) {
        loggers.push(WriteLogger::new(LevelFilter::Info, config.clone(), file));
    }

    loggers.push(TermLogger::new(LevelFilter::Info, config, TerminalMode::Mixed, ColorChoice::Auto));

    let _ = CombinedLogger::init(loggers);
}
