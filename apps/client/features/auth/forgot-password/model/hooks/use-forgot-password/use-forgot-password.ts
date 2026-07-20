import { type ForgotPasswordValues, forgotPasswordSchema } from '@gnomevpn/schemas';
import { useMutation } from '@tanstack/react-query';

import { authClient } from '@/shared/api';
import { ROUTES } from '@/shared/constants';

export type { ForgotPasswordValues };
export { forgotPasswordSchema };

export const useForgotPassword = () =>
  useMutation({
    mutationFn: async ({ email }: ForgotPasswordValues) => {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}${ROUTES.resetPassword}`,
      });

      if (error) {
        throw new Error('errors.resetLinkFailed');
      }
    },
  });
