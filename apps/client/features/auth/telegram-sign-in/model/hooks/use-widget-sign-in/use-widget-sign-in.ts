import { useMutation } from '@tanstack/react-query';

import { saveAuthToken, signInWithTelegram } from '@/shared/api';

export const useWidgetSignIn = () =>
  useMutation({
    mutationFn: async (payload: Record<string, string>) => {
      const { token } = await signInWithTelegram(payload);

      saveAuthToken(token);
    }
  });
