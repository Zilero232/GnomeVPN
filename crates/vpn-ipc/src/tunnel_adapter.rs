use std::net::Ipv4Addr;

pub const TUNNEL_NAME: &str = "gnomevpn0";

pub const TUNNEL_ADDRESS: Ipv4Addr = Ipv4Addr::new(10, 8, 0, 2);

pub const TUNNEL_PREFIX: u8 = 24;

pub const TUNNEL_MTU: u16 = 1360;

pub fn tunnel_address_cidr() -> String {
    format!("{TUNNEL_ADDRESS}/{TUNNEL_PREFIX}")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn renders_the_address_with_its_prefix() {
        assert_eq!(tunnel_address_cidr(), "10.8.0.2/24");
    }

    #[test]
    fn keeps_the_mtu_inside_a_u16() {
        assert_eq!(u32::from(TUNNEL_MTU), 1360);
    }
}
