'use client';

import { useMutation } from '@tanstack/react-query';

import { authClient, clearToken, disconnectTunnel, queryClient } from '@/shared/api';
import { isTauriDesktop, settleAll, vpnDisconnect } from '@/shared/lib';

export const useSignOut = () => {
  return useMutation({
    mutationFn: async () => {
      const cleanup = [disconnectTunnel()];

      if (isTauriDesktop()) {
        cleanup.push(vpnDisconnect());
      }

      await settleAll('sign-out cleanup', cleanup);

      await authClient.signOut();

      clearToken();
      queryClient.clear();
    },
  });
};
