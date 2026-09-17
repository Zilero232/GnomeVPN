import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { useToastError } from '@/entities/app/locale';
import { rotateSubscriptionLink } from '@/shared/api';
import { QUERY_KEYS } from '@/shared/constants';

export const useRotateLink = () => {
  const t = useTranslations('incy');
  const queryClient = useQueryClient();
  const toastError = useToastError();

  return useMutation({
    mutationFn: rotateSubscriptionLink,
    onSuccess: (link) => {
      queryClient.setQueryData(QUERY_KEYS.subscriptionLink(), link);

      toast.success(t('rotated'), { description: t('rotatedHint') });
    },
    onError: toastError
  });
};
