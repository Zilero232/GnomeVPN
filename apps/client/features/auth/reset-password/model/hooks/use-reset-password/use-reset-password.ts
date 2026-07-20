import { type ResetPasswordValues, resetPasswordSchema } from '@gnomevpn/schemas';
import { useMutation } from '@tanstack/react-query';

import { authClient } from '@/shared/api';

import type { ResetPasswordInput } from './use-reset-password.types';

export type { ResetPasswordValues };
export { resetPasswordSchema };

export const useResetPassword = () =>
  useMutation({
    mutationFn: async ({ newPassword, token }: ResetPasswordInput) => {
      const { error } = await authClient.resetPassword({ newPassword, token });

      if (error) {
        throw new Error('errors.passwordResetFailed');
      }
    },
  });
