import { useMutation } from '@tanstack/react-query';

import { useToastError } from '@/entities/app/locale';
import { bindCard } from '@/shared/api';

import { useSettlePayment } from '../use-settle-payment';

export const useBindCard = () => {
  const settlePayment = useSettlePayment();
  const toastError = useToastError();

  return useMutation({
    mutationFn: bindCard,
    onSuccess: settlePayment,
    onError: toastError
  });
};
