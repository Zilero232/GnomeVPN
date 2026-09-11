import { isNonNullish } from 'remeda';

import type { FirstReachableInput, NodeReachability, ResolveReachabilityInput } from './node-reachability.types';

export const resolveReachability = ({ node, latency, isMeasuring }: ResolveReachabilityInput): NodeReachability => {
  if (!node || node.status === 'offline') {
    return 'unreachable';
  }

  const rttMs = latency[node.id];

  if (isNonNullish(rttMs)) {
    return 'reachable';
  }

  const wasProbed = node.id in latency;

  if (wasProbed && !isMeasuring) {
    return 'unreachable';
  }

  return isMeasuring ? 'probing' : 'reachable';
};

export const firstReachableNode = ({ nodes, latency, isMeasuring }: FirstReachableInput) =>
  nodes.find((node) => resolveReachability({ node, latency, isMeasuring }) !== 'unreachable');
