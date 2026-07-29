'use client';

import { useTranslations } from 'next-intl';

import { useLocale } from '@/entities/app/locale';
import { LOCALE_LABELS, LOCALES } from '@/shared/i18n';
import { Segmented } from '@/shared/ui';

export const LocaleSwitcher = () => {
  const t = useTranslations('tray');
  const { locale, setLocale } = useLocale();

  return (
    <Segmented
      options={LOCALES.map((option) => ({
        value: option,
        label: option,
        'aria-label': LOCALE_LABELS[option]
      }))}
      aria-label={t('language')}
      value={locale}
      onChange={setLocale}
    />
  );
};
