'use client';

import { useState } from 'react';

import type { UseNodeSelectionInput } from './use-node-selection.types';

import { firstReachableNode, resolveReachability } from '../../../lib';

export const useNodeSelection = ({ nodes, activeNodeId, latency, isMeasuring }: UseNodeSelectionInput) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const fallbackId = firstReachableNode({ nodes, latency, isMeasuring })?.id ?? null;
  const nodeId = activeNodeId ?? selectedNodeId ?? fallbackId;
  const node = nodes.find((candidate) => candidate.id === nodeId);

  const reachability = resolveReachability({ node, latency, isMeasuring });

  return {
    nodeId,
    node,
    country: node?.country ?? '',
    reachability,
    isReachable: reachability !== 'unreachable',
    select: setSelectedNodeId
  };
};
