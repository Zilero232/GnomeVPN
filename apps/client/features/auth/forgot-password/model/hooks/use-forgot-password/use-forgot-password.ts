import { type ForgotPasswordValues, forgotPasswordSchema } from '@gnomevpn/schemas';
import { useMutation } from '@tanstack/react-query';

import { authClient } from '@/shared/api';
import { SITE } from '@/shared/config';
import { ROUTES } from '@/shared/constants';
import { isTauriDesktop, isTauriMobile } from '@/shared/lib';

export type { ForgotPasswordValues };
export { forgotPasswordSchema };

const resetLinkBase = (): string =>
  isTauriDesktop() || isTauriMobile() ? SITE.url : window.location.origin;

export const useForgotPassword = () =>
  useMutation({
    mutationFn: async ({ email }: ForgotPasswordValues) => {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: `${resetLinkBase()}${ROUTES.resetPassword}`,
      });

      if (error) {
        throw new Error('errors.resetLinkFailed');
      }
    },
  });
