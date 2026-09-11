'use client';

import type { TunnelProtocol } from '@gnomevpn/schemas';

import { DEFAULT_PROTOCOL } from '@/entities/vpn/protocol';
import { protocolSetting, useSetting } from '@/shared/lib';

import type { UseProtocolSelection } from './use-protocol-selection.types';

export const useProtocolSelection = (): UseProtocolSelection => {
  const { value, write } = useSetting<TunnelProtocol>({ setting: protocolSetting, initial: DEFAULT_PROTOCOL });

  return { protocol: value, select: write };
};
