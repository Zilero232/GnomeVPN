pub mod install;
mod runner;

pub use runner::start;

pub const SERVICE_NAME: &str = "GnomeVPNService";

pub const DISPLAY_NAME: &str = "GnomeVPN Tunnel Service";

pub const DESCRIPTION: &str = "Поднимает туннель GnomeVPN. Без неё приложение требовало бы прав администратора при каждом запуске.";
