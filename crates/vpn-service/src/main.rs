mod pipe;
mod tunnel;

#[cfg(target_os = "windows")]
mod service;

#[cfg(target_os = "windows")]
fn main() -> Result<(), Box<dyn std::error::Error>> {
    match std::env::args().nth(1).as_deref() {
        Some("install") => {
            service::install::install()?;
            println!("service installed and started");
            Ok(())
        }
        Some("uninstall") => {
            service::install::uninstall()?;
            println!("service removed");
            Ok(())
        }
        _ => service::start(),
    }
}

#[cfg(not(target_os = "windows"))]
fn main() {
    eprintln!("gnomevpn-service is Windows-only; on other platforms the GUI runs the tunnel itself");
    std::process::exit(1);
}
