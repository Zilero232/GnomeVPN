use std::time::Duration;

use gnomevpn_ipc::probe_latency;
use serde::{Deserialize, Serialize};

const ATTEMPTS: usize = 2;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProbeTarget {
    pub id: String,
    pub host: String,
    pub port: u16,
    pub server_name: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProbeOutcome {
    pub id: String,
    pub rtt_ms: Option<u32>,
}

async fn measure(target: &ProbeTarget) -> Option<Duration> {
    let mut best: Option<Duration> = None;

    for _ in 0..ATTEMPTS {
        if let Ok(rtt) = probe_latency(&target.host, target.port, &target.server_name).await {
            best = Some(best.map_or(rtt, |current: Duration| current.min(rtt)));
        }
    }

    best
}

#[tauri::command]
pub async fn vpn_probe_latency(targets: Vec<ProbeTarget>) -> Vec<ProbeOutcome> {
    let handles = targets
        .into_iter()
        .map(|target| {
            tauri::async_runtime::spawn(async move {
                let rtt = measure(&target).await;

                ProbeOutcome {
                    id: target.id,
                    rtt_ms: rtt.map(|value| value.as_millis().min(u128::from(u32::MAX)) as u32),
                }
            })
        })
        .collect::<Vec<_>>();

    let mut outcomes = Vec::with_capacity(handles.len());

    for handle in handles {
        if let Ok(outcome) = handle.await {
            outcomes.push(outcome);
        }
    }

    outcomes
}
