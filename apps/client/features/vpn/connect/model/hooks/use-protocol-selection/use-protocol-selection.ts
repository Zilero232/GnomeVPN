'use client';

import type { TunnelProtocol } from '@gnomevpn/schemas';

import { useEffect, useState } from 'react';

import { DEFAULT_PROTOCOL } from '@/entities/vpn/protocol';
import { protocolSetting } from '@/shared/lib';

export const useProtocolSelection = () => {
  const [protocol, setSelected] = useState<TunnelProtocol>(DEFAULT_PROTOCOL);

  useEffect(() => {
    protocolSetting.get().then(setSelected);
  }, []);

  const select = (next: TunnelProtocol) => {
    setSelected(next);
    protocolSetting.set(next);
  };

  return { protocol, select };
};
