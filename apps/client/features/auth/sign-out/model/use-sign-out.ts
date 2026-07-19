'use client';

import { useMutation } from '@tanstack/react-query';

import { authClient, clearToken, disconnectTunnel, queryClient } from '@/shared/api';
import { isTauriDesktop, logger, vpnDisconnect } from '@/shared/lib';

export const useSignOut = () => {
  return useMutation({
    mutationFn: async () => {
      const cleanup = [disconnectTunnel()];

      if (isTauriDesktop()) {
        cleanup.push(vpnDisconnect());
      }

      const results = await Promise.allSettled(cleanup);

      for (const result of results) {
        if (result.status === 'rejected') {
          logger.warn(`sign-out cleanup failed: ${String(result.reason)}`);
        }
      }

      await authClient.signOut();

      clearToken();
      queryClient.clear();
    },
  });
};
