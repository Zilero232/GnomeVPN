import { useMutation } from '@tanstack/react-query';

import { saveAuthToken, signInWithTelegram } from '@/shared/api';

export const useWidgetSignIn = () =>
  useMutation({
    mutationFn: async (idToken: string) => {
      const { token } = await signInWithTelegram(idToken);

      saveAuthToken(token);
    }
  });
