'use client';

import { useMutation } from '@tanstack/react-query';

import { authClient } from '@/shared/api';

import type { ChangePasswordValues } from '@gnomevpn/schemas';

export const useChangePassword = () =>
  useMutation({
    mutationFn: async ({ currentPassword, newPassword }: ChangePasswordValues) => {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });

      if (error) {
        throw new Error(error.message ?? 'Failed to change password');
      }
    },
  });
