import { useMutation, useQueryClient } from '@tanstack/react-query';

import { cancelAutoRenew } from '@/shared/api';
import { QUERY_KEYS } from '@/shared/constants';

export const useCancelAutoRenew = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelAutoRenew,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subscriptionStatus() });
    },
  });
};
