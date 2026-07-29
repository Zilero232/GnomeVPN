'use client';

import { useState } from 'react';

import type { UseNodeSelectionInput } from './use-node-selection.types';

export const useNodeSelection = ({ nodes, activeNodeId }: UseNodeSelectionInput) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const firstReachableId = nodes.find((node) => node.status !== 'offline')?.id ?? null;
  const nodeId = activeNodeId ?? selectedNodeId ?? firstReachableId;
  const node = nodes.find((candidate) => candidate.id === nodeId);

  return {
    nodeId,
    node,
    country: node?.country ?? '',
    isReachable: node?.status !== undefined && node.status !== 'offline',
    select: setSelectedNodeId
  };
};
