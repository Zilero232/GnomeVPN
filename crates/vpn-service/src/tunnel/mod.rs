pub mod adapter;
pub mod engine;
pub mod singbox;
pub mod supervisor;

use std::sync::Arc;

use backon::{ExponentialBuilder, Retryable};
use gnomevpn_ipc::{TunnelConfig, TunnelEvent};
use tokio::runtime::Handle;

use supervisor::Supervisor;

const MIN_RETRY_DELAY: std::time::Duration = std::time::Duration::from_secs(2);
const MAX_RETRY_DELAY: std::time::Duration = std::time::Duration::from_secs(30);
const MAX_RETRIES: usize = 5;

pub fn spawn(
    runtime: &Handle,
    supervisor: Arc<Supervisor>,
    config: TunnelConfig,
    split_apps: Vec<String>,
) {
    let Some(stop) = supervisor.take_stop_receiver() else {
        log::error!("spawn called without a reserved tunnel slot");
        supervisor.finish();
        return;
    };

    runtime.spawn(async move {
        let emitter = Arc::clone(&supervisor);
        let emit: Arc<dyn Fn(TunnelEvent) + Send + Sync> =
            Arc::new(move |event| emitter.publish(event));

        let (stop_tx, stop_rx) = tokio::sync::watch::channel(false);

        tokio::spawn(async move {
            let _ = stop.await;
            let _ = stop_tx.send(true);
        });

        let attempt = || {
            let config = config.clone();
            let split_apps = split_apps.clone();
            let emit = Arc::clone(&emit);
            let mut watcher = stop_rx.clone();

            async move {
                if *watcher.borrow() {
                    return Ok(());
                }

                let (attempt_stop, rx) = tokio::sync::oneshot::channel();

                tokio::spawn(async move {
                    while watcher.changed().await.is_ok() {
                        if *watcher.borrow() {
                            let _ = attempt_stop.send(());
                            return;
                        }
                    }
                });

                engine::run_tunnel(config, split_apps, emit, rx).await
            }
        };

        let stopped = stop_rx.clone();
        let retryable = Arc::clone(&supervisor);
        let notifier = Arc::clone(&supervisor);

        let result = attempt
            .retry(
                ExponentialBuilder::default()
                    .with_min_delay(MIN_RETRY_DELAY)
                    .with_max_delay(MAX_RETRY_DELAY)
                    .with_max_times(MAX_RETRIES),
            )
            .when(move |_| retryable.auto_reconnect_enabled() && !*stopped.borrow())
            .notify(move |error, delay| {
                log::warn!("tunnel failed ({error}), reconnecting in {delay:?}");
                notifier.publish(TunnelEvent::Connecting);
            })
            .await;

        if let Err(error) = &result {
            if !*stop_rx.borrow() {
                supervisor.publish(TunnelEvent::Error {
                    message: error.to_string(),
                });
            }
        }

        supervisor.finish();
    });
}

#[derive(Debug, thiserror::Error)]
pub enum TunnelError {
    #[error("sing-box error: {0}")]
    Singbox(String),
}
