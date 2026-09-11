import type { TunnelProtocol } from '@gnomevpn/schemas';

export type UseProtocolSelection = {
  protocol: TunnelProtocol;
  select: (next: TunnelProtocol) => void;
};
