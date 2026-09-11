import type { LatencyByNode } from '@/shared/lib';

import { listNodeEndpoints } from '@/shared/api';
import { probeNodeLatency } from '@/shared/lib';

export const measureNodeLatency = async (): Promise<LatencyByNode> => {
  const targets = await listNodeEndpoints();

  return probeNodeLatency({ targets });
};
