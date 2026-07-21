'use client';

import { useMutation } from '@tanstack/react-query';

import { authClient, clearToken, disconnectTunnel, queryClient } from '@/shared/api';
import { getDeviceId, isTauriDesktop, settleAll, vpnDisconnect } from '@/shared/lib';

export const useSignOut = () => {
  return useMutation({
    mutationFn: async () => {
      const cleanup = [getDeviceId().then((deviceId) => disconnectTunnel({ deviceId }))];

      if (isTauriDesktop()) {
        cleanup.push(vpnDisconnect());
      }

      await settleAll({ label: 'sign-out cleanup', tasks: cleanup });

      await authClient.signOut();

      clearToken();
      queryClient.clear();
    },
  });
};
