use std::path::PathBuf;

use gnomevpn_ipc::{TunnelConfig, TunnelProtocol};
use serde::{Deserialize, Serialize};
use tauri::plugin::{Builder, PluginApi, PluginHandle, TauriPlugin};
use tauri::{Manager, Runtime};

use super::engine;
use super::MobileVpnError;

const PLUGIN_NAME: &str = "gnomevpn";
const PLUGIN_IDENTIFIER: &str = "ru.gnomevpn.app";
const PLUGIN_CLASS: &str = "VpnPlugin";

fn tun_address(config: &TunnelConfig) -> String {
    match (config.protocol, config.wireguard.as_ref()) {
        (TunnelProtocol::Wireguard, Some(wireguard)) => wireguard.address.clone(),
        _ => engine::assigned_ip(config),
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct StartArgs {
    server: String,
    dns: Vec<String>,
    tun_address: String,
    config_json: String,
}

#[derive(Deserialize)]
struct PermissionResult {
    granted: bool,
}

#[derive(Deserialize)]
struct NativeDirResult {
    path: String,
}

#[derive(Deserialize, Serialize)]
pub struct TrafficResult {
    pub rx: u64,
    pub tx: u64,
}

#[derive(Serialize)]
struct AutoReconnectArgs {
    enabled: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ShareConfigArgs {
    file_name: String,
    content: String,
}

#[derive(Deserialize)]
struct ShareResult {
    shared: bool,
}

#[derive(Deserialize)]
struct AutoConnectResult {
    requested: bool,
}

#[derive(Deserialize)]
struct RunningResult {
    running: bool,
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

    pub fn is_running(&self) -> Result<bool, MobileVpnError> {
        let result: RunningResult = self
            .0
            .run_mobile_plugin("isRunning", Empty {})
            .map_err(|error| MobileVpnError::Service(error.to_string()))?;

        Ok(result.running)
    }

    pub fn native_library_dir(&self) -> Result<PathBuf, MobileVpnError> {
        let result: NativeDirResult = self
            .0
            .run_mobile_plugin("nativeLibraryDir", Empty {})
            .map_err(|error| MobileVpnError::Service(error.to_string()))?;

        Ok(PathBuf::from(result.path))
    }

    pub fn start(&self, config: &TunnelConfig) -> Result<(), MobileVpnError> {
        let config_json = serde_json::to_string(config).map_err(|error| MobileVpnError::Service(error.to_string()))?;

        self.0
            .run_mobile_plugin::<()>(
                "start",
                StartArgs {
                    server: config.server.clone(),
                    dns: config.dns.clone(),
                    tun_address: tun_address(config),
                    config_json,
                },
            )
            .map_err(|error| MobileVpnError::Service(error.to_string()))
    }

    pub fn set_auto_reconnect(&self, enabled: bool) -> Result<(), MobileVpnError> {
        self.0
            .run_mobile_plugin::<()>("setAutoReconnect", AutoReconnectArgs { enabled })
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

    pub fn request_permission(&self) -> Result<bool, MobileVpnError> {
        let result: PermissionResult = self
            .0
            .run_mobile_plugin("requestPermission", Empty {})
            .map_err(|error| MobileVpnError::Service(error.to_string()))?;

        Ok(result.granted)
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

    pub fn share_config(&self, file_name: String, content: String) -> Result<bool, MobileVpnError> {
        let result: ShareResult = self
            .0
            .run_mobile_plugin("shareConfig", ShareConfigArgs { file_name, content })
            .map_err(|error| MobileVpnError::Service(error.to_string()))?;

        Ok(result.shared)
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
