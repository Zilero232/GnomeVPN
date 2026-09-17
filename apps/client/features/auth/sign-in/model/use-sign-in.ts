import type { SignInValues } from '@gnomevpn/schemas';

import { signInSchema } from '@gnomevpn/schemas';
import { useMutation } from '@tanstack/react-query';

import { authClient, unwrapAuth } from '@/shared/api';

export type { SignInValues };
export { signInSchema };

export const useSignIn = () =>
  useMutation({
    mutationFn: async (values: SignInValues) => unwrapAuth({ result: await authClient.signIn.email(values), fallbackKey: 'errors.signInFailed' })
  });
