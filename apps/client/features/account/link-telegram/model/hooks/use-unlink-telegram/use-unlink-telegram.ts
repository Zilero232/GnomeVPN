import { useMutation, useQueryClient } from '@tanstack/react-query';

import { unlinkTelegram } from '@/shared/api';
import { QUERY_KEYS } from '@/shared/constants';

export const useUnlinkTelegram = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unlinkTelegram,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.telegramStatus() })
  });
};
