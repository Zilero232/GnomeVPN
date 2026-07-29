import type { SignUpValues } from '@gnomevpn/schemas';

import { signUpSchema } from '@gnomevpn/schemas';
import { useMutation } from '@tanstack/react-query';

import { authClient, unwrapAuth } from '@/shared/api';

export type { SignUpValues };
export { signUpSchema };

export const useSignUp = () =>
  useMutation({
    mutationFn: async ({ email, password, name }: SignUpValues) =>
      unwrapAuth(await authClient.signUp.email({ email, password, name }), 'errors.signUpFailed')
  });
