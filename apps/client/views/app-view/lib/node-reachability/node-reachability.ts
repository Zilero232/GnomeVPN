import { isNonNullish } from 'remeda';

import type { FirstReachableInput, NodeReachability, ResolveReachabilityInput } from './node-reachability.types';

export const resolveReachability = ({ node, latency, isMeasuring }: ResolveReachabilityInput): NodeReachability => {
  if (!node || node.status === 'offline') {
    return 'unreachable';
  }

  if (isNonNullish(latency[node.id])) {
    return 'reachable';
  }

  const wasProbed = node.id in latency;

  if (wasProbed && !isMeasuring) {
    return 'unreachable';
  }

  return 'probing';
};

export const isConnectable = (reachability: NodeReachability): boolean => reachability === 'reachable';

export const firstReachableNode = ({ nodes, latency, isMeasuring }: FirstReachableInput) => {
  const probed = nodes.find((node) => resolveReachability({ node, latency, isMeasuring }) === 'reachable');

  return probed ?? nodes.find((node) => resolveReachability({ node, latency, isMeasuring }) === 'probing');
};
