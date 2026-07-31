use netdev::Interface;

#[derive(Default)]
pub struct Traffic {
    pub rx: u64,
    pub tx: u64,
}

fn find(name: &str) -> Option<Interface> {
    netdev::get_interfaces()
        .into_iter()
        .find(|interface| interface.name == name || interface.friendly_name.as_deref() == Some(name))
}

pub fn is_up(name: &str) -> bool {
    find(name).is_some_and(|interface| interface.is_up())
}

pub fn traffic(name: &str) -> Traffic {
    find(name)
        .and_then(|interface| interface.stats)
        .map(|stats| Traffic {
            rx: stats.rx_bytes,
            tx: stats.tx_bytes,
        })
        .unwrap_or_default()
}
