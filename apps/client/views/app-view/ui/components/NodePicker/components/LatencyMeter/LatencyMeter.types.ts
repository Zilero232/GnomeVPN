import type { LatencyGrade } from '../../../../../lib';

export type LatencyMeterProps = {
  grade: LatencyGrade;
  isStale: boolean;
  rttMs: number;
};
