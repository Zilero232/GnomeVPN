'use client';

import type { ChangePasswordValues } from '@gnomevpn/schemas';

import { useMutation } from '@tanstack/react-query';

import { authClient, unwrapAuth } from '@/shared/api';

export const useChangePassword = () =>
  useMutation({
    mutationFn: async ({ currentPassword, newPassword }: ChangePasswordValues) => {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true
      });

      unwrapAuth({ result, fallbackKey: 'errors.passwordResetFailed' });
    }
  });
