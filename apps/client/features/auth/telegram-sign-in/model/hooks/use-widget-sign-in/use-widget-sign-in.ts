import { useMutation } from '@tanstack/react-query';

import { signInWithTelegram, startSession } from '@/shared/api';

export const useWidgetSignIn = () =>
  useMutation({
    mutationFn: async (payload: Record<string, string>) => {
      const { token } = await signInWithTelegram(payload);

      startSession(token);
    }
  });
