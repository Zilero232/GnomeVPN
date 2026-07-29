import type { LatencyGrade } from './latency-grade.types';

import { LATENCY_FAIR_MS, LATENCY_FAST_MS } from '../../config';

export const gradeLatency = (rttMs: number): LatencyGrade => {
  if (rttMs <= LATENCY_FAST_MS) {
    return 'fast';
  }

  if (rttMs <= LATENCY_FAIR_MS) {
    return 'fair';
  }

  return 'slow';
};
