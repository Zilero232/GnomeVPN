'use client';

import { clsx } from 'clsx';

import { useLocale } from '@/entities/app/locale';
import { LOCALES } from '@/shared/i18n';

import s from './LocaleSwitcher.module.scss';

export const LocaleSwitcher = () => {
  const { locale, setLocale } = useLocale();

  return (
    <div className={s.root}>
      {LOCALES.map((option) => (
        <button
          className={clsx(s.option, locale === option && s.active)}
          key={option}
          type="button"
          onClick={() => setLocale(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
};
