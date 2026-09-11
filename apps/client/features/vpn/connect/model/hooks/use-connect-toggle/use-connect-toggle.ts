'use client';

import type { UseConnectToggleInput } from './use-connect-toggle.types';

import { useVpnConnectionContext } from '../../context/vpn-connection-context';

export const useConnectToggle = ({ hasAccess, resolveTarget, onDenied, onUnavailable }: UseConnectToggleInput) => {
  const { status, connect, disconnect } = useVpnConnectionContext();

  const toggle = async () => {
    if (status === 'connected') {
      await disconnect();

      return;
    }

    if (!hasAccess) {
      await onDenied();

      return;
    }

    const target = await resolveTarget();

    if (!target) {
      await onUnavailable?.();

      return;
    }

    await connect(target);
  };

  return { toggle };
};
