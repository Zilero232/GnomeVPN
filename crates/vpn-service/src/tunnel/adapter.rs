use std::net::Ipv4Addr;

use netdev::Interface;

#[derive(Default)]
pub struct Traffic {
    pub rx: u64,
    pub tx: u64,
}

fn find(name: &str, address: Ipv4Addr) -> Option<Interface> {
    let interfaces = netdev::get_interfaces();

    interfaces
        .iter()
        .find(|interface| interface.name == name || interface.friendly_name.as_deref() == Some(name))
        .or_else(|| interfaces.iter().find(|interface| interface.ipv4.iter().any(|net| net.addr() == address)))
        .cloned()
}

pub fn is_up(name: &str, address: Ipv4Addr) -> bool {
    find(name, address).is_some_and(|interface| interface.is_up())
}

pub fn traffic(name: &str, address: Ipv4Addr) -> Traffic {
    find(name, address)
        .and_then(|interface| interface.stats)
        .map(|stats| Traffic {
            rx: stats.rx_bytes,
            tx: stats.tx_bytes,
        })
        .unwrap_or_default()
}
