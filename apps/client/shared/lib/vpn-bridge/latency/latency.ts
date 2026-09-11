import { mapToObj } from 'remeda';

import type { LatencyByNode, ProbeLatencyInput } from './latency.types';

import { callRust } from '../../ipc';

export const probeNodeLatency = async ({ targets }: ProbeLatencyInput): Promise<LatencyByNode> => {
  const outcomes = await callRust({
    command: 'vpn_probe_latency',
    args: { targets },
    fallback: []
  });

  return mapToObj(outcomes, ({ id, rttMs }) => [id, rttMs]);
};
