'use client';

import type { ChangeEmailValues } from '@gnomevpn/schemas';

import { useMutation } from '@tanstack/react-query';

import { authClient, unwrapAuth } from '@/shared/api';
import { ROUTES } from '@/shared/constants';

export const useChangeEmail = () =>
  useMutation({
    mutationFn: async ({ newEmail }: ChangeEmailValues) => {
      unwrapAuth({ result: await authClient.changeEmail({ newEmail, callbackURL: ROUTES.account }), fallbackKey: 'errors.emailChangeFailed' });
    }
  });
