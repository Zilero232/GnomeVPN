import type { SignInValues } from '@gnomevpn/schemas';

import { signInSchema } from '@gnomevpn/schemas';
import { useMutation } from '@tanstack/react-query';

import { authClient, queryClient, unwrapAuth } from '@/shared/api';

export type { SignInValues };
export { signInSchema };

export const useSignIn = () =>
  useMutation({
    mutationFn: async (values: SignInValues) => {
      const session = unwrapAuth({ result: await authClient.signIn.email(values), fallbackKey: 'errors.signInFailed' });

      queryClient.clear();

      return session;
    }
  });
