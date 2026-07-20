'use client';

import { useMutation } from '@tanstack/react-query';

import { authClient } from '@/shared/api';
import { ROUTES } from '@/shared/constants';

import type { ChangeEmailValues } from '@gnomevpn/schemas';

export const useChangeEmail = () =>
  useMutation({
    mutationFn: async ({ newEmail }: ChangeEmailValues) => {
      const { error } = await authClient.changeEmail({ newEmail, callbackURL: ROUTES.account });

      if (error) {
        throw new Error(error.message ?? 'Failed to change email');
      }
    },
  });
