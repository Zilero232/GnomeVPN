use std::sync::Arc;

use gnomevpn_ipc::{validate_split, Request, Response, SplitConfig, TunnelConfig, PROTOCOL_VERSION};

use crate::tunnel::supervisor::{Supervisor, SupervisorError};

#[derive(Debug, PartialEq, Eq)]
pub enum Action {
    Reply(Response),
    StartTunnel(Response, Box<TunnelConfig>, SplitConfig),
    Reject(Response),
}

#[derive(Default)]
pub struct Session {
    is_handshaken: bool,
}

pub fn handle(request: Request, session: &mut Session, supervisor: &Arc<Supervisor>) -> Action {
    if !session.is_handshaken && !matches!(request, Request::Hello { .. }) {
        log::warn!("request before the handshake, dropping the connection");

        return Action::Reject(Response::Error {
            message: "handshake required: send Hello first".to_string(),
        });
    }

    match request {
        Request::Hello { protocol_version } => {
            if protocol_version != PROTOCOL_VERSION {
                return Action::Reject(Response::Error {
                    message: format!("protocol mismatch: client {protocol_version}, service {PROTOCOL_VERSION}"),
                });
            }

            session.is_handshaken = true;

            Action::Reply(Response::Hello {
                protocol_version: PROTOCOL_VERSION,
            })
        }

        Request::Status => Action::Reply(Response::Status { status: supervisor.status() }),

        Request::Disconnect => {
            log::info!("disconnect requested over the pipe");
            supervisor.stop();
            Action::Reply(Response::Ok)
        }

        Request::Connect {
            config,
            auto_reconnect,
            split,
        } => {
            log::info!(
                "connect request over the pipe: {}:{} sni={} auto_reconnect={auto_reconnect} apps_mode={:?} apps={} ips_mode={:?} ips={}",
                config.server,
                config.port,
                config.server_name,
                split.apps_mode,
                split.apps.len(),
                split.ips_mode,
                split.ips.len()
            );

            if let Err(error) = validate_split(&split) {
                log::warn!("connect rejected by validation: {error}");

                return Action::Reply(Response::Error { message: error.to_string() });
            }

            match supervisor.begin(&config) {
                Ok(()) => {
                    supervisor.set_options(auto_reconnect);

                    Action::StartTunnel(Response::Ok, config, split)
                }
                Err(error @ SupervisorError::AlreadyRunning) => {
                    log::warn!("connect rejected: {error}");
                    Action::Reply(Response::Error { message: error.to_string() })
                }
                Err(SupervisorError::Rejected(error)) => {
                    log::warn!("connect rejected by validation: {error}");
                    Action::Reply(Response::Error { message: error.to_string() })
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn supervisor() -> Arc<Supervisor> {
        Arc::new(Supervisor::new())
    }

    fn hello() -> Request {
        Request::Hello {
            protocol_version: PROTOCOL_VERSION,
        }
    }

    #[test]
    fn rejects_a_request_that_arrives_before_the_handshake() {
        let mut session = Session::default();

        assert!(matches!(handle(Request::Status, &mut session, &supervisor()), Action::Reject(_)));
    }

    #[test]
    fn rejects_disconnect_before_the_handshake() {
        let mut session = Session::default();

        assert!(matches!(handle(Request::Disconnect, &mut session, &supervisor()), Action::Reject(_)));
    }

    #[test]
    fn accepts_a_request_once_the_handshake_completed() {
        let mut session = Session::default();
        let supervisor = supervisor();

        assert!(matches!(
            handle(hello(), &mut session, &supervisor),
            Action::Reply(Response::Hello { .. })
        ));
        assert!(matches!(
            handle(Request::Status, &mut session, &supervisor),
            Action::Reply(Response::Status { .. })
        ));
    }

    #[test]
    fn rejects_a_handshake_carrying_another_protocol_version() {
        let mut session = Session::default();

        let action = handle(
            Request::Hello {
                protocol_version: PROTOCOL_VERSION + 1,
            },
            &mut session,
            &supervisor(),
        );

        assert!(matches!(action, Action::Reject(_)));
    }

    #[test]
    fn leaves_the_session_unhandshaken_after_a_version_mismatch() {
        let mut session = Session::default();
        let supervisor = supervisor();

        handle(
            Request::Hello {
                protocol_version: PROTOCOL_VERSION + 1,
            },
            &mut session,
            &supervisor,
        );

        assert!(matches!(handle(Request::Status, &mut session, &supervisor), Action::Reject(_)));
    }
}
