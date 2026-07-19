use parking_lot::Mutex;

use super::client::ServiceClient;

#[derive(Default)]
pub struct VpnState {
    connection: Mutex<Option<ServiceClient>>,
}

impl VpnState {
    pub fn replace_connection(&self, client: ServiceClient) {
        *self.connection.lock() = Some(client);
    }

    pub fn clear_connection(&self) {
        *self.connection.lock() = None;
    }

    pub fn is_connected(&self) -> bool {
        self.connection.lock().is_some()
    }
}
