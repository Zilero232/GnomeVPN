import type { NodeStatus } from '@gnomevpn/schemas';
import type { HealthInput } from './node-status.types';

const ONLINE_WINDOW_MS = 3 * 60_000;
const DEGRADED_WINDOW_MS = 10 * 60_000;

export const resolveNodeStatus = ({ enabled, lastHealthyAt }: HealthInput): NodeStatus => {
  if (!enabled || !lastHealthyAt) {
    return 'offline';
  }

  const age = Date.now() - lastHealthyAt.getTime();

  if (age <= ONLINE_WINDOW_MS) {
    return 'online';
  }

  if (age <= DEGRADED_WINDOW_MS) {
    return 'degraded';
  }

  return 'offline';
};
