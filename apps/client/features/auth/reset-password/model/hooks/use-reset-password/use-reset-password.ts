import type { ResetPasswordValues } from '@gnomevpn/schemas';

import { resetPasswordSchema } from '@gnomevpn/schemas';
import { useMutation } from '@tanstack/react-query';

import { authClient, unwrapAuth } from '@/shared/api';

import type { ResetPasswordInput } from './use-reset-password.types';

export type { ResetPasswordValues };
export { resetPasswordSchema };

export const useResetPassword = () =>
  useMutation({
    mutationFn: async ({ newPassword, token }: ResetPasswordInput) => {
      unwrapAuth({ result: await authClient.resetPassword({ newPassword, token }), fallbackKey: 'errors.passwordResetFailed' });
    }
  });
