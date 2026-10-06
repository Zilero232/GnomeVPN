import { useMutation } from '@tanstack/react-query';

import { useInvalidateSubscription } from '@/entities/billing/subscription';
import { claimTrial } from '@/shared/api';

export const useClaimTrial = () => {
  const invalidateSubscription = useInvalidateSubscription();

  return useMutation({
    mutationFn: claimTrial,
    onSuccess: invalidateSubscription
  });
};
