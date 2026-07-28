'use client';

import { useTranslations } from 'next-intl';

export const usePasswordLabels = () => {
  const t = useTranslations('common');

  return { showLabel: t('showPassword'), hideLabel: t('hidePassword') };
};
