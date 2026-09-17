'use client';

import { useMutation } from '@tanstack/react-query';

import { authClient, clearToken, queryClient } from '@/shared/api';

export const useSignOut = () =>
  useMutation({
    mutationFn: async () => {
      await authClient.signOut();

      clearToken();
      queryClient.clear();
    }
  });
