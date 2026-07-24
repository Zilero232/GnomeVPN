use std::path::PathBuf;
use std::sync::Mutex;

use gnomevpn_ipc::TunnelConfig;
use jni::objects::{JClass, JString};
use jni::sys::jint;
use jni::JNIEnv;
use tokio::runtime::Runtime;
use tun2proxy::CancellationToken;

use super::engine;

struct Session {
    runtime: Runtime,
    cancellation: CancellationToken,
}

static SESSION: Mutex<Option<Session>> = Mutex::new(None);

fn read_string(env: &mut JNIEnv, value: &JString) -> Option<String> {
    env.get_string(value).ok().map(|value| value.into())
}

#[no_mangle]
pub extern "system" fn Java_ru_gnomevpn_app_TunnelEngine_nativeStart(
    mut env: JNIEnv,
    _class: JClass,
    native_lib_dir: JString,
    data_dir: JString,
    config_json: JString,
    fd: jint,
) -> jint {
    let (Some(native_lib_dir), Some(data_dir), Some(config_json)) = (
        read_string(&mut env, &native_lib_dir),
        read_string(&mut env, &data_dir),
        read_string(&mut env, &config_json),
    ) else {
        log::error!("nativeStart: invalid arguments");

        return 0;
    };

    let config: TunnelConfig = match serde_json::from_str(&config_json) {
        Ok(config) => config,
        Err(error) => {
            log::error!("nativeStart: bad config: {error}");

            return 0;
        }
    };

    let runtime = match Runtime::new() {
        Ok(runtime) => runtime,
        Err(error) => {
            log::error!("nativeStart: cannot start runtime: {error}");

            return 0;
        }
    };

    let cancellation = CancellationToken::new();
    let worker = cancellation.clone();
    let native_lib_dir = PathBuf::from(native_lib_dir);
    let data_dir = PathBuf::from(data_dir);

    runtime.spawn(async move {
        if let Err(error) =
            engine::run_tunnel(&native_lib_dir, &data_dir, &config, fd, worker).await
        {
            log::error!("service tunnel stopped: {error}");
        }
    });

    if let Ok(mut guard) = SESSION.lock() {
        if let Some(previous) = guard.replace(Session {
            runtime,
            cancellation,
        }) {
            previous.cancellation.cancel();
            previous.runtime.shutdown_background();
        }
    }

    1
}

#[no_mangle]
pub extern "system" fn Java_ru_gnomevpn_app_TunnelEngine_nativeStop(_env: JNIEnv, _class: JClass) {
    if let Ok(mut guard) = SESSION.lock() {
        if let Some(session) = guard.take() {
            session.cancellation.cancel();
            session.runtime.shutdown_background();
        }
    }
}
