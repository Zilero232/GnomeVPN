import { useMutation } from '@tanstack/react-query';

import { useToastError } from '@/entities/app/locale';
import { useInvalidateSubscription } from '@/entities/billing/subscription';
import { unbindCard } from '@/shared/api';

export const useUnbindCard = () => {
  const invalidateSubscription = useInvalidateSubscription();
  const toastError = useToastError();

  return useMutation({
    mutationFn: unbindCard,
    onSuccess: invalidateSubscription,
    onError: toastError
  });
};
