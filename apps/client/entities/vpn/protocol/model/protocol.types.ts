import type { TunnelProtocol } from '@gnomevpn/schemas';

export type ProtocolIcon = 'shield' | 'zap';

export type ProtocolTraitGrade = 'high' | 'mid';

export type ProtocolTrait = {
  key: string;
  grade: ProtocolTraitGrade;
};

export type ProtocolOption = {
  protocol: TunnelProtocol;
  icon: ProtocolIcon;
  isRecommended?: boolean;
  tagKey?: string;
  descKey: string;
  noteKey?: string;
  noteHintKey?: string;
  traits: ProtocolTrait[];
};

export type ProtocolControlProps = {
  value: TunnelProtocol;
  isDisabled?: boolean;
  onChange: (protocol: TunnelProtocol) => void;
};
