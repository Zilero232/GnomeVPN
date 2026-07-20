import { isAfter, subMilliseconds } from 'date-fns';

import { DEGRADED_WINDOW_MS, ONLINE_WINDOW_MS } from '../config';

import type { NodeStatus } from '@gnomevpn/schemas';
import type { HealthInput } from './node-status.types';

export const resolveNodeStatus = ({ enabled, lastHealthyAt }: HealthInput): NodeStatus => {
  if (!enabled || !lastHealthyAt) {
    return 'offline';
  }

  const now = new Date();

  if (isAfter(lastHealthyAt, subMilliseconds(now, ONLINE_WINDOW_MS))) {
    return 'online';
  }

  if (isAfter(lastHealthyAt, subMilliseconds(now, DEGRADED_WINDOW_MS))) {
    return 'degraded';
  }

  return 'offline';
};
