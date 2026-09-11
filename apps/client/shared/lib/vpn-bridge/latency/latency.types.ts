import type { NodeEndpoint } from '@gnomevpn/schemas';

export type ProbeLatencyInput = {
  targets: NodeEndpoint[];
};

export type LatencyByNode = Record<string, number | null>;
