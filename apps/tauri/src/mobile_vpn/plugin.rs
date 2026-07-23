use std::path::PathBuf;

use gnomevpn_ipc::TunnelConfig;
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
#[serde(rename_all = "camelCase")]
struct RememberArgs {
    server: String,
    port: u16,
    auth: String,
    server_name: String,
    insecure: bool,
    dns: Vec<String>,
}

#[derive(Deserialize)]
struct AutoConnectResult {
    requested: bool,
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

    pub fn remember_tunnel(&self, config: &TunnelConfig) -> Result<(), MobileVpnError> {
        self.0
            .run_mobile_plugin::<()>(
                "rememberTunnel",
                RememberArgs {
                    server: config.server.clone(),
                    port: config.port,
                    auth: config.auth.clone(),
                    server_name: config.server_name.clone(),
                    insecure: config.insecure,
                    dns: config.dns.clone(),
                },
            )
            .map_err(|error| MobileVpnError::Service(error.to_string()))
    }

    pub fn forget_tunnel(&self) -> Result<(), MobileVpnError> {
        self.0
            .run_mobile_plugin::<()>("forgetTunnel", Empty {})
            .map_err(|error| MobileVpnError::Service(error.to_string()))
    }

    pub fn take_auto_connect(&self) -> Result<bool, MobileVpnError> {
        let result: AutoConnectResult = self
            .0
            .run_mobile_plugin("consumeAutoConnect", Empty {})
            .map_err(|error| MobileVpnError::Service(error.to_string()))?;

        Ok(result.requested)
    }

    pub fn move_to_background(&self) -> Result<(), MobileVpnError> {
        self.0
            .run_mobile_plugin::<()>("moveToBackground", Empty {})
            .map_err(|error| MobileVpnError::Service(error.to_string()))
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
