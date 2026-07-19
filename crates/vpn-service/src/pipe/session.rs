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
            supervisor.stop();
            Action::Reply(Response::Ok)
        }

        Request::Connect {
            config,
            kill_switch,
            auto_reconnect,
        } => match supervisor.begin(&config) {
            Ok(()) => {
                supervisor.set_options(kill_switch, auto_reconnect);

                Action::StartTunnel(Response::Ok, config)
            }
            Err(error @ SupervisorError::AlreadyRunning) => Action::Reply(Response::Error {
                message: error.to_string(),
            }),
            Err(SupervisorError::Rejected(error)) => Action::Reply(Response::Error {
                message: error.to_string(),
            }),
        },
    }
}
