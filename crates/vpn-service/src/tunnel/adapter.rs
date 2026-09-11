use gnomevpn_ipc::{Traffic, TUNNEL_ADDRESS, TUNNEL_NAME};
use netdev::Interface;

fn find() -> Option<Interface> {
    let (name, address) = (TUNNEL_NAME, TUNNEL_ADDRESS);

    let interfaces = netdev::get_interfaces();

    interfaces
        .iter()
        .find(|interface| interface.name == name || interface.friendly_name.as_deref() == Some(name))
        .or_else(|| interfaces.iter().find(|interface| interface.ipv4.iter().any(|net| net.addr() == address)))
        .cloned()
}

pub fn is_up() -> bool {
    find().is_some_and(|interface| interface.is_up())
}

pub fn traffic() -> Traffic {
    find()
        .and_then(|interface| interface.stats)
        .map(|stats| Traffic {
            rx: stats.rx_bytes,
            tx: stats.tx_bytes,
        })
        .unwrap_or_default()
}
