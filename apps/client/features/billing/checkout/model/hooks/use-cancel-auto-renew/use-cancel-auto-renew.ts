import { useMutation } from '@tanstack/react-query';

import { useToastError } from '@/entities/app/locale';
import { useInvalidateSubscription } from '@/entities/billing/subscription';
import { cancelAutoRenew } from '@/shared/api';

export const useCancelAutoRenew = () => {
  const invalidateSubscription = useInvalidateSubscription();
  const toastError = useToastError();

  return useMutation({
    mutationFn: cancelAutoRenew,
    onSuccess: invalidateSubscription,
    onError: toastError
  });
};
