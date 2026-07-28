import { useMutation } from '@tanstack/react-query';

import { useToastError } from '@/entities/app/locale';
import { buyExtraDevices } from '@/shared/api';
import { clientKind } from '@/shared/lib';
import { redirectToConfirmation } from '../../lib';

export const useBuyExtraDevices = () => {
  const toastError = useToastError();

  return useMutation({
    mutationFn: (quantity: number) => buyExtraDevices({ quantity, client: clientKind() }),
    onSuccess: (result) => redirectToConfirmation(result.confirmationUrl),
    onError: toastError,
  });
};
