'use client';

import { useMutation } from '@tanstack/react-query';

import { authClient } from '@/shared/api';

import type { UpdateNameValues } from '@gnomevpn/schemas';

export const useUpdateName = () =>
  useMutation({
    mutationFn: async ({ name }: UpdateNameValues) => {
      const { error } = await authClient.updateUser({ name });

      if (error) {
        throw new Error(error.message ?? 'Failed to update name');
      }
    },
  });
