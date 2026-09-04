import type { TunnelProtocol } from '@gnomevpn/schemas';

export type ConfigSlot = {
  name: string;
  nodeId: string;
  protocol: TunnelProtocol;
};

export type IsConfigNameTakenInput = {
  configs: ConfigSlot[];
  slot: ConfigSlot;
};

export type TakenConfigNamesInput = {
  configs: ConfigSlot[];
  nodeId: string | undefined;
  protocol: TunnelProtocol | undefined;
};
