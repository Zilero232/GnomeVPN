'use client';

import { MonitorDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

import { ROUTES } from '@/shared/constants';
import { Button, Text } from '@/shared/ui';

import s from './DesktopOnlyView.module.scss';

export const DesktopOnlyView = () => {
  const t = useTranslations('desktopOnly');

  return (
    <main className={s.root}>
      <span className={s.icon}>
        <MonitorDown size={30} />
      </span>

      <Text as='h1' className={s.title}>
        {t('title')}
      </Text>
      <Text as='p' className={s.body}>
        {t('body')}
      </Text>

      <div className={s.actions}>
        <Link href={ROUTES.landing}>
          <Button>{t('download')}</Button>
        </Link>
        <Link href={ROUTES.account}>
          <Button variant='ghost'>{t('account')}</Button>
        </Link>
      </div>
    </main>
  );
};
