import { useMutation } from '@tanstack/react-query';

import { useToastError } from '@/entities/app/locale';
import { createCheckout } from '@/shared/api';
import { clientKind, openExternal } from '@/shared/lib';

import type { PlanId } from '@gnomevpn/schemas';

export const useCheckout = () => {
  const toastError = useToastError();

  return useMutation({
    mutationFn: (planId: PlanId) => createCheckout(planId, clientKind()),
    onSuccess: async (result) => {
      await openExternal(result.confirmationUrl);
    },
    onError: toastError,
  });
};
