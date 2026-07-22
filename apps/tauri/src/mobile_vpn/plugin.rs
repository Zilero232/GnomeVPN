use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use tauri::plugin::{Builder, PluginApi, PluginHandle, TauriPlugin};
use tauri::{Manager, Runtime};

use super::MobileVpnError;

const PLUGIN_NAME: &str = "gnomevpn";
const PLUGIN_IDENTIFIER: &str = "app.gnomevpn.mobile";
const PLUGIN_CLASS: &str = "VpnPlugin";

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct StartArgs {
    server: String,
    dns: Vec<String>,
}

#[derive(Deserialize)]
struct StartResult {
    fd: i32,
}

#[derive(Deserialize)]
struct PermissionResult {
    granted: bool,
}

#[derive(Deserialize)]
struct NativeDirResult {
    path: String,
}

#[derive(Deserialize)]
pub struct TrafficResult {
    pub rx: u64,
    pub tx: u64,
}

#[derive(Serialize)]
struct Empty {}

pub struct VpnPlugin<R: Runtime>(PluginHandle<R>);

impl<R: Runtime> VpnPlugin<R> {
    pub fn has_permission(&self) -> Result<bool, MobileVpnError> {
        let result: PermissionResult = self
            .0
            .run_mobile_plugin("hasPermission", Empty {})
            .map_err(|error| MobileVpnError::Service(error.to_string()))?;

        Ok(result.granted)
    }

    pub fn native_library_dir(&self) -> Result<PathBuf, MobileVpnError> {
        let result: NativeDirResult = self
            .0
            .run_mobile_plugin("nativeLibraryDir", Empty {})
            .map_err(|error| MobileVpnError::Service(error.to_string()))?;

        Ok(PathBuf::from(result.path))
    }

    pub fn start(&self, server: &str, dns: &[String]) -> Result<i32, MobileVpnError> {
        let result: StartResult = self
            .0
            .run_mobile_plugin(
                "start",
                StartArgs {
                    server: server.to_string(),
                    dns: dns.to_vec(),
                },
            )
            .map_err(|error| MobileVpnError::Service(error.to_string()))?;

        Ok(result.fd)
    }

    pub fn traffic(&self) -> Result<TrafficResult, MobileVpnError> {
        self.0
            .run_mobile_plugin("traffic", Empty {})
            .map_err(|error| MobileVpnError::Service(error.to_string()))
    }

    pub fn stop(&self) -> Result<(), MobileVpnError> {
        self.0
            .run_mobile_plugin::<()>("stop", Empty {})
            .map_err(|error| MobileVpnError::Service(error.to_string()))
    }
}

fn setup<R: Runtime>(api: PluginApi<R, ()>) -> Result<VpnPlugin<R>, MobileVpnError> {
    let handle = api
        .register_android_plugin(PLUGIN_IDENTIFIER, PLUGIN_CLASS)
        .map_err(|error| MobileVpnError::Service(error.to_string()))?;

    Ok(VpnPlugin(handle))
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new(PLUGIN_NAME)
        .setup(|app, api| {
            app.manage(setup(api)?);

            Ok(())
        })
        .build()
}
