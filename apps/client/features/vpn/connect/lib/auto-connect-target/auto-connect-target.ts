import type { Node } from '@gnomevpn/schemas';

import { isNonNullish } from 'remeda';

import type { AutoConnectTargetInput } from './auto-connect-target.types';

export const autoConnectTarget = ({ nodes, latency, lastNodeId }: AutoConnectTargetInput): Node | null => {
  const answered = nodes.filter((node) => node.status !== 'offline' && isNonNullish(latency[node.id]));

  if (answered.length === 0) {
    return null;
  }

  const preferred = answered.find((node) => node.id === lastNodeId);

  if (preferred) {
    return preferred;
  }

  return answered.reduce((best, node) => ((latency[node.id] ?? Infinity) < (latency[best.id] ?? Infinity) ? node : best));
};
