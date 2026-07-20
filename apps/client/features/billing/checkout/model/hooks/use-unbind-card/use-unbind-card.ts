import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useErrorMessage } from '@/entities/app/locale';
import { unbindCard } from '@/shared/api';
import { QUERY_KEYS } from '@/shared/constants';

export const useUnbindCard = () => {
  const queryClient = useQueryClient();
  const errorMessage = useErrorMessage();

  return useMutation({
    mutationFn: unbindCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subscriptionStatus() });
    },
    onError: (error: unknown) => toast.error(errorMessage(error)),
  });
};
