import type { PlanId } from '@gnomevpn/schemas';

import { useMutation } from '@tanstack/react-query';

import { useToastError } from '@/entities/app/locale';
import { createCheckout } from '@/shared/api';

import { redirectToConfirmation } from '../../checkout.helpers';

export const useCheckout = () => {
  const toastError = useToastError();

  return useMutation({
    mutationFn: (planId: PlanId) => createCheckout({ planId }),
    onSuccess: (result) => redirectToConfirmation(result.confirmationUrl),
    onError: toastError
  });
};
