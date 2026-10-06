'use client';

import { useMutation } from '@tanstack/react-query';
import { useLocale } from 'next-intl';

import { useToastError } from '@/entities/app/locale';
import { useAccountIdentity } from '@/entities/auth/user';
import { requestPasswordReset } from '@/shared/api';
import { resolveLocale } from '@/shared/i18n';

import type { SetPasswordState, UseSetPasswordInput } from './use-set-password.types';

export const useSetPassword = ({ onSent }: UseSetPasswordInput): SetPasswordState => {
  const toastError = useToastError();
  const locale = resolveLocale(useLocale());
  const { email, hasEmail } = useAccountIdentity();

  const { isPending, mutate } = useMutation({
    mutationFn: () => requestPasswordReset({ email, locale }),
    onSuccess: onSent,
    onError: toastError
  });

  return { hasEmail, isPending, send: () => mutate() };
};
