import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useErrorMessage } from '@/entities/app/locale';
import { bindCard } from '@/shared/api';
import { QUERY_KEYS } from '@/shared/constants';

export const useBindCard = () => {
  const queryClient = useQueryClient();
  const errorMessage = useErrorMessage();

  return useMutation({
    mutationFn: bindCard,
    onSuccess: (result) => {
      if (result.confirmationUrl) {
        window.location.href = result.confirmationUrl;

        return;
      }

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subscriptionStatus() });
    },
    onError: (error: unknown) => toast.error(errorMessage(error)),
  });
};
