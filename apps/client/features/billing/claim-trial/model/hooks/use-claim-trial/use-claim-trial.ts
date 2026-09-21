import { useMutation, useQueryClient } from '@tanstack/react-query';

import { claimTrial } from '@/shared/api';
import { QUERY_KEYS } from '@/shared/constants';

export const useClaimTrial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: claimTrial,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subscriptionStatus() })
  });
};
