'use client';

import { useMutation } from '@tanstack/react-query';

import { authClient, clearToken, disconnectTunnel, queryClient } from '@/shared/api';
import { getDeviceId, isTauriDesktop, settleAll, vpnDisconnect } from '@/shared/lib';

export const useSignOut = () => {
  return useMutation({
    mutationFn: async () => {
      const deviceId = await getDeviceId();
      const tasks = [disconnectTunnel({ deviceId }), authClient.signOut()];

      if (isTauriDesktop()) {
        tasks.push(vpnDisconnect());
      }

      await settleAll({ label: 'sign-out', tasks });

      clearToken();
      queryClient.clear();
    },
  });
};
