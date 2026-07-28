import { type SignInValues, signInSchema } from '@gnomevpn/schemas';
import { useMutation } from '@tanstack/react-query';

import { authClient, unwrapAuth } from '@/shared/api';

export type { SignInValues };
export { signInSchema };

export const useSignIn = () => {
  return useMutation({
    mutationFn: async (values: SignInValues) =>
      unwrapAuth(await authClient.signIn.email(values), 'errors.signInFailed'),
  });
};
