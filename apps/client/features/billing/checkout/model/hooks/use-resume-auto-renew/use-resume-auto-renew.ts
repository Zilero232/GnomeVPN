import { useMutation } from '@tanstack/react-query';

import { useToastError } from '@/entities/app/locale';
import { useInvalidateSubscription } from '@/entities/billing/subscription';
import { resumeAutoRenew } from '@/shared/api';

export const useResumeAutoRenew = () => {
  const invalidateSubscription = useInvalidateSubscription();
  const toastError = useToastError();

  return useMutation({
    mutationFn: resumeAutoRenew,
    onSuccess: invalidateSubscription,
    onError: toastError,
  });
};
