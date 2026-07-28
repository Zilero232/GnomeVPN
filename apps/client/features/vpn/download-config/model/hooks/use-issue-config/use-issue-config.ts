import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { useToastError } from '@/entities/app/locale';
import { issueConfig } from '@/shared/api';
import { QUERY_KEYS } from '@/shared/constants';
import { saveFile } from '@/shared/lib';

export const useIssueConfig = () => {
  const t = useTranslations('configs');
  const queryClient = useQueryClient();
  const toastError = useToastError();

  return useMutation({
    mutationFn: issueConfig,
    onSuccess: async (download) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.configs() });

      const { target, fileName } = await saveFile(download);

      if (target === 'shared') {
        return;
      }

      toast.success(t('downloaded', { fileName }), { description: t('savedHint') });
    },
    onError: toastError,
  });
};
