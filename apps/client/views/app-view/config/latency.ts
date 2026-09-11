export const LATENCY_FAST_MS = 90;

export const LATENCY_FAIR_MS = 200;

export const GRADE_BARS = {
  fast: 3,
  fair: 2,
  slow: 1
} as const;

export const GRADE_LABEL_KEY = {
  fast: 'nodeGradeFast',
  fair: 'nodeGradeFair',
  slow: 'nodeGradeSlow'
} as const;

export const SIGNAL_BARS = [0, 1, 2] as const;
