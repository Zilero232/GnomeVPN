import type { LatencyByNode } from '@/shared/lib';

export type UseNodeLatencyInput = {
  isEnabled?: boolean;
};

export type UseNodeLatency = {
  isMeasuring: boolean;
  latency: LatencyByNode;
  remeasure: () => Promise<unknown>;
};
