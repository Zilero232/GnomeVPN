import { useMutation } from '@tanstack/react-query';

import { redeemTelegramLogin, saveAuthToken } from '@/shared/api';

export const useTelegramSignIn = () =>
  useMutation({
    mutationFn: async (code: string) => {
      const { token } = await redeemTelegramLogin(code);

      saveAuthToken(token);
    }
  });
