import { useCopy } from '@siberiacancode/reactuse';
import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { useErrorMessage } from '@/entities/app/locale';
import { issueConfig } from '@/shared/api';

export const useCopyConfig = () => {
  const t = useTranslations('configs');
  const errorMessage = useErrorMessage();

  const { copy } = useCopy();

  return useMutation({
    mutationFn: issueConfig,
    // The file holds one vless:// line, and every client imports it from the
    // clipboard rather than from disk, so the download is a detour.
    onSuccess: async ({ blob }) => {
      await copy((await blob.text()).trim());

      toast.success(t('copied'), { description: t('copiedHint') });
    },
    onError: (error: unknown) => toast.error(errorMessage(error)),
  });
};
