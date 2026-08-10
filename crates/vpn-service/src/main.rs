#[cfg(any(target_os = "windows", unix))]
mod pipe;
#[cfg(any(target_os = "windows", unix))]
mod service;
#[cfg(any(target_os = "windows", unix))]
mod tunnel;

#[cfg(any(target_os = "windows", unix))]
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

#[cfg(not(any(target_os = "windows", unix)))]
fn main() {
    eprintln!("gnomevpn-service supports Windows, macOS and Linux only");
    std::process::exit(1);
}
