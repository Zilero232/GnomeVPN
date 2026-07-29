use std::fs;

const PROC_NET_DEV: &str = "/proc/net/dev";
const RX_BYTES_COLUMN: usize = 0;
const TX_BYTES_COLUMN: usize = 8;
const TUN_PREFIX: &str = "tun";

#[derive(Clone, Copy, Default, PartialEq, Eq)]
pub struct Traffic {
    pub rx: u64,
    pub tx: u64,
}

fn parse(contents: &str) -> Option<Traffic> {
    let mut total = Traffic::default();
    let mut seen = false;

    for line in contents.lines() {
        let Some((name, counters)) = line.split_once(':') else {
            continue;
        };

        if !name.trim().starts_with(TUN_PREFIX) {
            continue;
        }

        let columns: Vec<&str> = counters.split_whitespace().collect();

        let rx = columns
            .get(RX_BYTES_COLUMN)
            .and_then(|v| v.parse::<u64>().ok());
        let tx = columns
            .get(TX_BYTES_COLUMN)
            .and_then(|v| v.parse::<u64>().ok());

        let (Some(rx), Some(tx)) = (rx, tx) else {
            continue;
        };

        total.rx = total.rx.saturating_add(rx);
        total.tx = total.tx.saturating_add(tx);
        seen = true;
    }

    seen.then_some(total)
}

/// Bytes the kernel counted on the tunnel interface.
///
/// `TrafficStats.getUidRxBytes()` counts every socket the app owns, so it keeps
/// climbing from ordinary API calls while the tunnel is dead. These counters are
/// per interface, so they only move when the tunnel moves — which is what makes
/// them usable as a liveness signal.
///
/// Returns `None` when the counters cannot be read, so a caller can tell "no
/// traffic" apart from "cannot tell" and avoid tearing down a healthy tunnel.
pub fn read() -> Option<Traffic> {
    parse(&fs::read_to_string(PROC_NET_DEV).ok()?)
}

#[cfg(test)]
mod tests {
    use super::*;

    const SAMPLE: &str = "Inter-|   Receive                    |  Transmit
 face |bytes    packets errs drop fifo frame compressed multicast|bytes    packets errs drop fifo colls carrier compressed
    lo: 8328637326 6963248    0    0    0     0          0         0 8328637326 6963248    0    0    0     0       0          0
 tunl0:       0       0    0    0    0     0          0         0        0       0    0    0    0     0       0          0
  tun0: 2410625    5092    0    0    0     0          0         0  1322060    4842    0    0    0     0       0          0
";

    #[test]
    fn sums_tun_interfaces_and_ignores_the_rest() {
        let traffic = parse(SAMPLE).expect("tun counters");

        assert_eq!(traffic.rx, 2_410_625);
        assert_eq!(traffic.tx, 1_322_060);
    }

    #[test]
    fn reports_nothing_when_no_tunnel_exists() {
        assert!(parse("    lo: 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16\n").is_none());
    }
}
