'use client';

import { ROUTES } from '@/shared/constants';
import { messages, resolveLocale } from '@/shared/i18n';
import { isBrowser } from '@/shared/lib';
import { Button, StatusScreen } from '@/ui-kit';

import type { ErrorViewProps } from './ErrorView.types';

import s from './ErrorView.module.scss';

export const ErrorView = ({ error, reset }: ErrorViewProps) => {
  const [, segment] = isBrowser() ? window.location.pathname.split('/') : [];

  const t = messages[resolveLocale(segment)].error;

  return (
    <StatusScreen body={t.body} code={t.code} title={t.title} tone='danger'>
      <Button onClick={reset}>{t.retry}</Button>
      <Button variant='ghost' onClick={() => window.location.assign(ROUTES.landing)}>
        {t.home}
      </Button>

      {error.digest && <p className={s.digest}>{`${t.details}: ${error.digest}`}</p>}
    </StatusScreen>
  );
};
