import { useMutation } from '@tanstack/react-query';

import { useToastError } from '@/entities/app/locale';
import { buyExtraDevices } from '@/shared/api';

import { useSettlePayment } from '../use-settle-payment';

export const useBuyExtraDevices = () => {
  const settlePayment = useSettlePayment();
  const toastError = useToastError();

  return useMutation({
    mutationFn: (quantity: number) => buyExtraDevices({ quantity }),
    onSuccess: settlePayment,
    onError: toastError
  });
};
