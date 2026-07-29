use std::os::raw::c_void;
use std::sync::atomic::{AtomicU64, Ordering};

use tun2proxy::{tun2proxy_set_traffic_status_callback, TrafficStatus};

const REPORT_INTERVAL_SECS: u32 = 1;

static RX: AtomicU64 = AtomicU64::new(0);
static TX: AtomicU64 = AtomicU64::new(0);

#[derive(Clone, Copy, Default, PartialEq, Eq)]
pub struct Traffic {
    pub rx: u64,
    pub tx: u64,
}

unsafe extern "C" fn on_traffic(status: *const TrafficStatus, _context: *mut c_void) {
    let Some(status) = (unsafe { status.as_ref() }) else {
        return;
    };

    RX.store(status.rx, Ordering::Relaxed);
    TX.store(status.tx, Ordering::Relaxed);
}

pub fn install() {
    unsafe {
        tun2proxy_set_traffic_status_callback(
            REPORT_INTERVAL_SECS,
            Some(on_traffic),
            std::ptr::null_mut(),
        );
    }
}

pub fn read() -> Traffic {
    Traffic {
        rx: RX.load(Ordering::Relaxed),
        tx: TX.load(Ordering::Relaxed),
    }
}

pub fn reset() {
    RX.store(0, Ordering::Relaxed);
    TX.store(0, Ordering::Relaxed);
}
