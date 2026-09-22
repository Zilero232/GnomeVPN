'use client';

import { useMutation } from '@tanstack/react-query';

import { useToastError } from '@/entities/app/locale';
import { useAccountIdentity } from '@/entities/auth/user';
import { authClient } from '@/shared/api';
import { SITE } from '@/shared/config';
import { ROUTES } from '@/shared/constants';

import type { SetPasswordState, UseSetPasswordInput } from './use-set-password.types';

export const useSetPassword = ({ onSent }: UseSetPasswordInput): SetPasswordState => {
  const toastError = useToastError();
  const { email, hasEmail } = useAccountIdentity();

  const { isPending, mutate } = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.requestPasswordReset({ email, redirectTo: `${SITE.url}${ROUTES.resetPassword}` });

      if (error) {
        throw new Error('errors.resetLinkFailed');
      }
    },
    onSuccess: onSent,
    onError: toastError
  });

  return { hasEmail, isPending, send: () => mutate() };
};
