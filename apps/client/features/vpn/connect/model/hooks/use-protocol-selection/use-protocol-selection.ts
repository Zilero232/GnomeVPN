'use client';

import type { TunnelProtocol } from '@gnomevpn/schemas';

import { useEffect, useState } from 'react';

import { DEFAULT_PROTOCOL } from '@/entities/vpn/protocol';
import { logger, protocolSetting } from '@/shared/lib';

export const useProtocolSelection = () => {
  const [protocol, setSelected] = useState<TunnelProtocol>(DEFAULT_PROTOCOL);

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      const stored = await protocolSetting.get();

      if (!ignore) {
        setSelected(stored);
      }
    };

    void load();

    return () => {
      ignore = true;
    };
  }, []);

  const select = (next: TunnelProtocol) => {
    setSelected(next);

    protocolSetting.set(next).catch((error: unknown) => {
      logger.warn(`cannot persist the protocol: ${String(error)}`);
    });
  };

  return { protocol, select };
};
