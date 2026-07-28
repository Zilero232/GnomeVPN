import { useCopy } from '@siberiacancode/reactuse';
import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { useToastError } from '@/entities/app/locale';
import { issueConfig } from '@/shared/api';

export const useCopyConfig = () => {
  const t = useTranslations('configs');
  const toastError = useToastError();

  const { copy } = useCopy();

  return useMutation({
    mutationFn: issueConfig,
    onSuccess: async ({ blob }) => {
      await copy((await blob.text()).trim());

      toast.success(t('copied'), { description: t('copiedHint') });
    },
    onError: toastError,
  });
};
