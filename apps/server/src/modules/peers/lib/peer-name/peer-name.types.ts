import type { TunnelProtocol } from '@gnomevpn/schemas';

import type { PeerKind } from '../../../../../generated';

export type PeerNameInput = {
  userId: string;
  kind: PeerKind;
  name?: string | null;
  nodeId?: string;
  protocol?: TunnelProtocol | null;
};
