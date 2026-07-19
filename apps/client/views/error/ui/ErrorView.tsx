'use client';

import { useLocalStorage } from '@siberiacancode/reactuse';

import { ROUTES, STORAGE_KEYS } from '@/shared/constants';
import { DEFAULT_LOCALE, type Locale, messages, resolveLocale } from '@/shared/i18n';
import { Button, StatusScreen } from '@/shared/ui';

import s from './ErrorView.module.scss';

import type { ErrorViewProps } from './ErrorView.types';

export const ErrorView = ({ error, reset }: ErrorViewProps) => {
  const { value } = useLocalStorage<Locale>(STORAGE_KEYS.locale, DEFAULT_LOCALE);

  const t = messages[resolveLocale(value)].error;

  return (
    <StatusScreen body={t.body} code={t.code} title={t.title} tone="danger">
      <Button onClick={reset}>{t.retry}</Button>
      <Button variant="ghost" onClick={() => window.location.assign(ROUTES.landing)}>
        {t.home}
      </Button>

      {error.digest && <p className={s.digest}>{`${t.details}: ${error.digest}`}</p>}
    </StatusScreen>
  );
};
