import { useMutation } from '@tanstack/react-query';

import { useToastError } from '@/entities/app/locale';
import { createCheckout } from '@/shared/api';
import { clientKind } from '@/shared/lib';
import { redirectToConfirmation } from '../../lib';

import type { PlanId } from '@gnomevpn/schemas';

export const useCheckout = () => {
  const toastError = useToastError();

  return useMutation({
    mutationFn: (planId: PlanId) => createCheckout(planId, clientKind()),
    onSuccess: (result) => redirectToConfirmation(result.confirmationUrl),
    onError: toastError,
  });
};
