import { describe, expect, it } from 'vitest';

import { LATENCY_FAIR_MS, LATENCY_FAST_MS } from '../../../config';
import { gradeLatency } from '../latency-grade';

describe('gradeLatency', () => {
  it('grades an instant reply as fast', () => {
    expect(gradeLatency(0)).toBe('fast');
  });

  it('keeps the fast threshold itself fast', () => {
    expect(gradeLatency(LATENCY_FAST_MS)).toBe('fast');
  });

  it('drops to fair one millisecond past the fast threshold', () => {
    expect(gradeLatency(LATENCY_FAST_MS + 1)).toBe('fair');
  });

  it('keeps the fair threshold itself fair', () => {
    expect(gradeLatency(LATENCY_FAIR_MS)).toBe('fair');
  });

  it('drops to slow one millisecond past the fair threshold', () => {
    expect(gradeLatency(LATENCY_FAIR_MS + 1)).toBe('slow');
  });

  it('grades a far node as slow', () => {
    expect(gradeLatency(4000)).toBe('slow');
  });

  it('orders the thresholds so every grade is reachable', () => {
    expect(LATENCY_FAST_MS).toBeLessThan(LATENCY_FAIR_MS);
  });
});
