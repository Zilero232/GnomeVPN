import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { useToastError } from '@/entities/app/locale';
import { issueConfig } from '@/shared/api';
import { QUERY_KEYS } from '@/shared/constants';

export const useIssueConfig = () => {
  const t = useTranslations('configs');
  const queryClient = useQueryClient();
  const toastError = useToastError();

  return useMutation({
    mutationFn: issueConfig,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.configs() });

      toast.success(t('created'), { description: t('createdHint') });
    },
    onError: toastError
  });
};
