import type { NodeStatus } from '@gnomevpn/schemas';

export const STATUS_LABEL: Record<NodeStatus, string> = {
  online: 'nodeOnline',
  degraded: 'nodeDegraded',
  offline: 'nodeOffline',
};
