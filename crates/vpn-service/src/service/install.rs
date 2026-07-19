use std::ffi::{OsStr, OsString};
use std::time::{Duration, Instant};

use windows_service::service::{
    ServiceAccess, ServiceErrorControl, ServiceInfo, ServiceStartType, ServiceState, ServiceType,
};
use windows_service::service_manager::{ServiceManager, ServiceManagerAccess};

use super::{DESCRIPTION, DISPLAY_NAME, SERVICE_NAME};

const STOP_TIMEOUT: Duration = Duration::from_secs(15);
const POLL_INTERVAL: Duration = Duration::from_millis(250);

fn service_info() -> windows_service::Result<ServiceInfo> {
    Ok(ServiceInfo {
        name: OsString::from(SERVICE_NAME),
        display_name: OsString::from(DISPLAY_NAME),
        service_type: ServiceType::OWN_PROCESS,
        start_type: ServiceStartType::AutoStart,
        error_control: ServiceErrorControl::Normal,
        executable_path: std::env::current_exe().map_err(windows_service::Error::Winapi)?,
        launch_arguments: vec![],
        dependencies: vec![],
        account_name: None,
        account_password: None,
    })
}

pub fn install() -> windows_service::Result<()> {
    let manager = ServiceManager::local_computer(
        None::<&str>,
        ServiceManagerAccess::CONNECT | ServiceManagerAccess::CREATE_SERVICE,
    )?;

    let info = service_info()?;

    let access = ServiceAccess::CHANGE_CONFIG
        | ServiceAccess::START
        | ServiceAccess::STOP
        | ServiceAccess::QUERY_STATUS;

    let service = match manager.open_service(SERVICE_NAME, access) {
        Ok(existing) => {
            existing.change_config(&info)?;
            existing
        }
        Err(_) => manager.create_service(&info, access)?,
    };

    service.set_description(DESCRIPTION)?;

    if service.query_status()?.current_state != ServiceState::Stopped {
        return Ok(());
    }

    service.start(&[] as &[&OsStr])?;

    Ok(())
}

pub fn uninstall() -> windows_service::Result<()> {
    let manager = ServiceManager::local_computer(None::<&str>, ServiceManagerAccess::CONNECT)?;

    let Ok(service) = manager.open_service(
        SERVICE_NAME,
        ServiceAccess::STOP | ServiceAccess::DELETE | ServiceAccess::QUERY_STATUS,
    ) else {
        return Ok(());
    };

    if service.query_status()?.current_state != ServiceState::Stopped {
        let _ = service.stop();

        let deadline = Instant::now() + STOP_TIMEOUT;

        while Instant::now() < deadline {
            if service.query_status()?.current_state == ServiceState::Stopped {
                break;
            }

            std::thread::sleep(POLL_INTERVAL);
        }
    }

    service.delete()?;

    Ok(())
}
