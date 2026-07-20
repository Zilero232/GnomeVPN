import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useErrorMessage } from '@/entities/app/locale';
import { bindCard } from '@/shared/api';
import { QUERY_KEYS } from '@/shared/constants';
import { isTauriDesktop, openExternal } from '@/shared/lib';

export const useBindCard = () => {
  const queryClient = useQueryClient();
  const errorMessage = useErrorMessage();

  return useMutation({
    mutationFn: () => bindCard(isTauriDesktop() ? 'desktop' : 'web'),
    onSuccess: async (result) => {
      if (result.confirmationUrl) {
        await openExternal(result.confirmationUrl);

        return;
      }

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subscriptionStatus() });
    },
    onError: (error: unknown) => toast.error(errorMessage(error)),
  });
};
