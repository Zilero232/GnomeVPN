import { useMutation } from '@tanstack/react-query';

import { useInvalidateSubscription } from '@/entities/billing/subscription';
import { cancelAutoRenew } from '@/shared/api';

export const useCancelAutoRenew = () => {
  const invalidateSubscription = useInvalidateSubscription();

  return useMutation({
    mutationFn: cancelAutoRenew,
    onSuccess: invalidateSubscription
  });
};
