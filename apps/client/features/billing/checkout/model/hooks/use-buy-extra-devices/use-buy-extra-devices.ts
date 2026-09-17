import { useMutation } from '@tanstack/react-query';

import { useToastError } from '@/entities/app/locale';
import { buyExtraDevices } from '@/shared/api';

import { redirectToConfirmation } from '../../checkout.helpers';

export const useBuyExtraDevices = () => {
  const toastError = useToastError();

  return useMutation({
    mutationFn: (quantity: number) => buyExtraDevices({ quantity }),
    onSuccess: (result) => redirectToConfirmation(result.confirmationUrl),
    onError: toastError
  });
};
