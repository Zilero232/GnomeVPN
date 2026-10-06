import type { ForgotPasswordValues } from '@gnomevpn/schemas';

import { forgotPasswordSchema } from '@gnomevpn/schemas';
import { useMutation } from '@tanstack/react-query';
import { useLocale } from 'next-intl';

import { requestPasswordReset } from '@/shared/api';
import { resolveLocale } from '@/shared/i18n';

export type { ForgotPasswordValues };
export { forgotPasswordSchema };

export const useForgotPassword = () => {
  const locale = resolveLocale(useLocale());

  return useMutation({
    mutationFn: ({ email }: ForgotPasswordValues) => requestPasswordReset({ email, locale })
  });
};
