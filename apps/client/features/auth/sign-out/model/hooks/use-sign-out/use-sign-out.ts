'use client';

import { useMutation } from '@tanstack/react-query';

import { authClient, resetSession } from '@/shared/api';

export const useSignOut = () =>
  useMutation({
    mutationFn: async () => {
      try {
        await authClient.signOut();
      } finally {
        resetSession();
      }
    }
  });
