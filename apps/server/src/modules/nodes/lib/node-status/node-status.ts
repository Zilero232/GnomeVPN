import type { NodeStatus } from '@gnomevpn/schemas';

import { isAfter, subMilliseconds } from 'date-fns';

import type { HealthInput } from './node-status.types';

import { DEGRADED_WINDOW_MS, ONLINE_WINDOW_MS } from '../../config';

export const resolveNodeStatus = ({ isAvailable, lastHealthyAt }: HealthInput): NodeStatus => {
  if (!isAvailable || !lastHealthyAt) {
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
