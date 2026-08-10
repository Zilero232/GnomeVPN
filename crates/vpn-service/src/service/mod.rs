#[cfg(target_os = "windows")]
pub mod install;
#[cfg(target_os = "windows")]
mod runner;

#[cfg(unix)]
pub mod install_unix;
#[cfg(unix)]
mod runner_unix;

#[cfg(target_os = "windows")]
pub use runner::start;
#[cfg(unix)]
pub use runner_unix::start;

#[cfg(unix)]
pub use install_unix as install;

pub fn init_logging(dir: &std::path::Path) {
    use simplelog::{ColorChoice, CombinedLogger, LevelFilter, TermLogger, TerminalMode, WriteLogger};

    let _ = std::fs::create_dir_all(dir);

    let config = simplelog::Config::default();
    let mut loggers: Vec<Box<dyn simplelog::SharedLogger>> = Vec::new();

    if let Ok(file) = std::fs::OpenOptions::new().create(true).append(true).open(dir.join("service.log")) {
        loggers.push(WriteLogger::new(LevelFilter::Info, config.clone(), file));
    }

    loggers.push(TermLogger::new(LevelFilter::Info, config, TerminalMode::Mixed, ColorChoice::Auto));

    let _ = CombinedLogger::init(loggers);
}

#[cfg(target_os = "windows")]
pub const SERVICE_NAME: &str = "GnomeVPNService";

pub const DISPLAY_NAME: &str = "GnomeVPN Tunnel Service";

pub const DESCRIPTION: &str = "Поднимает туннель GnomeVPN. Без неё приложение требовало бы прав администратора при каждом запуске.";
