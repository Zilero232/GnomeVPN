import type { TunnelProtocol } from '@gnomevpn/schemas';

export type ProtocolOption = {
  protocol: TunnelProtocol;
  tagKey?: string;
  descKey: string;
};

export type ProtocolControlProps = {
  value: TunnelProtocol;
  isDisabled?: boolean;
  onChange: (protocol: TunnelProtocol) => void;
};
