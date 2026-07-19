'use client';

import { clsx } from 'clsx';
import { useTranslations } from 'next-intl';

import { useLocale } from '@/entities/app/locale';
import { LOCALE_LABELS, LOCALES } from '@/shared/i18n';

import s from './LocaleSwitcher.module.scss';

export const LocaleSwitcher = () => {
  const t = useTranslations('tray');
  const { locale, setLocale } = useLocale();

  return (
    <fieldset aria-label={t('language')} className={s.root}>
      {LOCALES.map((option) => (
        <button
          aria-label={LOCALE_LABELS[option]}
          aria-pressed={locale === option}
          className={clsx(s.option, locale === option && s.active)}
          key={option}
          type="button"
          onClick={() => setLocale(option)}
        >
          {option}
        </button>
      ))}
    </fieldset>
  );
};
