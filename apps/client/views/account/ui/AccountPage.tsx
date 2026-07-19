'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { usePlatform } from '@/entities/app/platform';
import { useCurrentUser } from '@/entities/auth/user';
import { useSubscriptionStatus } from '@/entities/billing/subscription';
import { LocaleSwitcher } from '@/features/app/switch-locale';
import { authClient, clearToken } from '@/shared/api';
import { ROUTES } from '@/shared/constants';
import { Button, Text } from '@/shared/ui';
import { SubscriptionCard } from './components';

import s from './AccountPage.module.scss';

export const AccountPage = () => {
  const t = useTranslations('account');
  const { isDesktopApp } = usePlatform();
  const { email } = useCurrentUser();
  const { subscription, isLoading } = useSubscriptionStatus();

  const onSignOut = async () => {
    await authClient.signOut();
    clearToken();
  };

  return (
    <main className={s.root}>
      {isDesktopApp && (
        <Link className={s.back} href={ROUTES.app}>
          <ArrowLeft size={15} />
          {t('backToVpn')}
        </Link>
      )}

      <div className={s.header}>
        <h1 className={s.title}>{t('title')}</h1>

        <div className={s.headerActions}>
          <LocaleSwitcher />
          <Button variant="ghost" onClick={onSignOut}>
            {t('signOut')}
          </Button>
        </div>
      </div>

      <Text size="xs" tone="muted">
        {email}
      </Text>

      <div className={s.card}>
        <SubscriptionCard isLoading={isLoading} subscription={subscription} />
      </div>
    </main>
  );
};
