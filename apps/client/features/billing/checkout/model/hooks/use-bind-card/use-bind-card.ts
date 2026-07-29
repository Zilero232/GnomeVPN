import { useMutation } from '@tanstack/react-query';

import { useToastError } from '@/entities/app/locale';
import { useInvalidateSubscription } from '@/entities/billing/subscription';
import { bindCard } from '@/shared/api';
import { clientKind } from '@/shared/lib';

import { redirectToConfirmation } from '../../lib';

export const useBindCard = () => {
  const invalidateSubscription = useInvalidateSubscription();
  const toastError = useToastError();

  return useMutation({
    mutationFn: () => bindCard(clientKind()),
    onSuccess: async (result) => {
      if (!(await redirectToConfirmation(result.confirmationUrl))) {
        invalidateSubscription();
      }
    },
    onError: toastError
  });
};
