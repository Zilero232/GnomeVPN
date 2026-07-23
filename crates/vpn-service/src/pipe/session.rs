use std::sync::Arc;

use gnomevpn_ipc::{Request, Response, TunnelConfig, PROTOCOL_VERSION};

use crate::tunnel::supervisor::{Supervisor, SupervisorError};

#[derive(Debug, PartialEq, Eq)]
pub enum Action {
    Reply(Response),
    StartTunnel(Response, Box<TunnelConfig>),
    Reject(Response),
}

pub fn handle(request: Request, supervisor: &Arc<Supervisor>) -> Action {
    match request {
        Request::Hello { protocol_version } => {
            if protocol_version != PROTOCOL_VERSION {
                return Action::Reject(Response::Error {
                    message: format!(
                        "protocol mismatch: client {protocol_version}, service {PROTOCOL_VERSION}"
                    ),
                });
            }

            Action::Reply(Response::Hello {
                protocol_version: PROTOCOL_VERSION,
            })
        }

        Request::Status => Action::Reply(Response::Status {
            status: supervisor.status(),
        }),

        Request::Disconnect => {
            log::info!("disconnect requested over the pipe");
            supervisor.stop();
            Action::Reply(Response::Ok)
        }

        Request::Connect {
            config,
            auto_reconnect,
        } => {
            log::info!(
                "connect request over the pipe: {}:{} sni={} auto_reconnect={auto_reconnect}",
                config.server,
                config.port,
                config.server_name
            );

            match supervisor.begin(&config) {
                Ok(()) => {
                    supervisor.set_options(auto_reconnect);

                    Action::StartTunnel(Response::Ok, config)
                }
                Err(error @ SupervisorError::AlreadyRunning) => {
                    log::warn!("connect rejected: {error}");
                    Action::Reply(Response::Error {
                        message: error.to_string(),
                    })
                }
                Err(SupervisorError::Rejected(error)) => {
                    log::warn!("connect rejected by validation: {error}");
                    Action::Reply(Response::Error {
                        message: error.to_string(),
                    })
                }
            }
        }
    }
}
