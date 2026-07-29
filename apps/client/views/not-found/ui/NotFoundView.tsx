'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';

import { ROUTES } from '@/shared/constants';
import { Button, StatusScreen } from '@/shared/ui';

export const NotFoundView = () => {
  const t = useTranslations('notFound');

  return (
    <StatusScreen body={t('body')} code={t('code')} title={t('title')}>
      <Link href={ROUTES.landing}>
        <Button>{t('home')}</Button>
      </Link>
      <Link href={ROUTES.account}>
        <Button variant='ghost'>{t('account')}</Button>
      </Link>
    </StatusScreen>
  );
};
