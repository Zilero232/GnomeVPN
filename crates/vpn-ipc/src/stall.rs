use std::time::{Duration, Instant};

pub const STALL_TIMEOUT: Duration = Duration::from_secs(60);
pub const STALL_MIN_BYTES: u64 = 32 * 1024;

pub const PROBE_INTERVAL: Duration = Duration::from_secs(45);

#[derive(Clone, Copy, Default, PartialEq, Eq)]
pub struct Traffic {
    pub rx: u64,
    pub tx: u64,
}

#[derive(Default)]
pub struct StallDetector {
    last_seen: Option<Traffic>,
    deaf_since: Option<Instant>,
    asked: u64,
    last_probe: Option<Instant>,
}

impl StallDetector {
    pub fn observe(&mut self, current: Traffic) -> Option<String> {
        self.observe_at(current, Instant::now())
    }

    pub fn observe_at(&mut self, current: Traffic, now: Instant) -> Option<String> {
        let previous = self.last_seen.replace(current)?;

        if current.rx > previous.rx {
            self.deaf_since = None;
            self.asked = 0;

            return None;
        }

        let sent = current.tx.saturating_sub(previous.tx);

        if sent == 0 {
            return None;
        }

        self.asked = self.asked.saturating_add(sent);

        let deaf_for = now.saturating_duration_since(*self.deaf_since.get_or_insert(now));

        if deaf_for < STALL_TIMEOUT || self.asked < STALL_MIN_BYTES {
            return None;
        }

        Some(format!("sent {} bytes over {}s with no reply", self.asked, deaf_for.as_secs()))
    }

    pub fn is_idle(&self) -> bool {
        self.deaf_since.is_none()
    }

    pub fn due_for_probe(&mut self) -> bool {
        self.due_for_probe_at(Instant::now())
    }

    pub fn due_for_probe_at(&mut self, now: Instant) -> bool {
        let due = self.last_probe.is_none_or(|at| now.saturating_duration_since(at) >= PROBE_INTERVAL);

        if due {
            self.last_probe = Some(now);
        }

        due
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn traffic(rx: u64, tx: u64) -> Traffic {
        Traffic { rx, tx }
    }

    fn deaf_detector(start: Instant) -> StallDetector {
        let mut detector = StallDetector::default();

        detector.observe_at(traffic(0, 0), start);

        detector
    }

    #[test]
    fn says_nothing_on_the_very_first_reading() {
        let mut detector = StallDetector::default();

        assert_eq!(detector.observe_at(traffic(0, 0), Instant::now()), None);
    }

    #[test]
    fn stays_quiet_while_bytes_keep_arriving() {
        let start = Instant::now();
        let mut detector = deaf_detector(start);

        for step in 1..60 {
            let at = start + STALL_TIMEOUT * step;
            let sent = STALL_MIN_BYTES * u64::from(step);

            assert_eq!(detector.observe_at(traffic(u64::from(step), sent), at), None);
        }
    }

    #[test]
    fn stays_quiet_while_nothing_is_sent_at_all() {
        let start = Instant::now();
        let mut detector = deaf_detector(start);

        let far_later = start + STALL_TIMEOUT * 100;

        assert_eq!(detector.observe_at(traffic(0, 0), far_later), None);
    }

    #[test]
    fn reports_a_stall_once_enough_bytes_went_unanswered_for_long_enough() {
        let start = Instant::now();
        let mut detector = deaf_detector(start);

        assert_eq!(detector.observe_at(traffic(0, STALL_MIN_BYTES), start), None);

        let reason = detector.observe_at(traffic(0, STALL_MIN_BYTES * 2), start + STALL_TIMEOUT);

        assert!(reason.is_some_and(|text| text.contains("no reply")));
    }

    #[test]
    fn waits_for_the_byte_threshold_however_long_it_has_been_deaf() {
        let start = Instant::now();
        let mut detector = deaf_detector(start);

        detector.observe_at(traffic(0, 1), start);

        assert_eq!(detector.observe_at(traffic(0, 2), start + STALL_TIMEOUT * 10), None);
    }

    #[test]
    fn measures_the_silence_against_the_clock_rather_than_counting_ticks() {
        let start = Instant::now();
        let mut detector = deaf_detector(start);

        detector.observe_at(traffic(0, STALL_MIN_BYTES), start);

        assert!(detector.observe_at(traffic(0, STALL_MIN_BYTES * 2), start + STALL_TIMEOUT).is_some());
    }

    #[test]
    fn forgets_the_silence_as_soon_as_a_reply_arrives() {
        let start = Instant::now();
        let mut detector = deaf_detector(start);

        detector.observe_at(traffic(0, STALL_MIN_BYTES), start);
        detector.observe_at(traffic(1, STALL_MIN_BYTES), start);

        assert!(detector.is_idle());
        assert_eq!(detector.observe_at(traffic(1, STALL_MIN_BYTES * 2), start + STALL_TIMEOUT), None);
    }

    #[test]
    fn counts_as_idle_until_something_goes_unanswered() {
        let start = Instant::now();
        let mut detector = deaf_detector(start);

        assert!(detector.is_idle());

        detector.observe_at(traffic(0, STALL_MIN_BYTES), start);

        assert!(!detector.is_idle());
    }

    #[test]
    fn probes_immediately_and_then_only_once_per_interval() {
        let start = Instant::now();
        let mut detector = StallDetector::default();

        assert!(detector.due_for_probe_at(start));
        assert!(!detector.due_for_probe_at(start + PROBE_INTERVAL / 2));
        assert!(detector.due_for_probe_at(start + PROBE_INTERVAL));
    }
}
