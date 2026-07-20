'use client';

import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useCurrentUser } from '@/entities/auth/user';
import { useSubscriptionStatus } from '@/entities/billing/subscription';
import { useSignOut } from '@/features/auth/sign-out';
import { ConfigList } from '@/features/vpn/download-config';
import { Tabs, Text } from '@/shared/ui';
import { AccountNav, ProfileCard, SubscriptionCard } from './components';

import s from './AccountPage.module.scss';

import type { TabItem } from '@/shared/ui';

export const AccountPage = () => {
  const t = useTranslations('account');
  const tConfigs = useTranslations('configs');
  const { email } = useCurrentUser();
  const { subscription, isLoading } = useSubscriptionStatus();

  const signOut = useSignOut();

  const tabs: TabItem[] = [
    {
      value: 'subscription',
      label: t('tabs.subscription'),
      content: <SubscriptionCard isLoading={isLoading} subscription={subscription} />,
    },
    {
      value: 'configs',
      label: tConfigs('title'),
      content: <ConfigList />,
    },
    {
      value: 'profile',
      label: t('profile.title'),
      content: <ProfileCard />,
    },
  ];

  return (
    <main className={s.root}>
      <AccountNav />

      <header className={s.header}>
        <h1 className={s.title}>{t('title')}</h1>
        <Text size="xs" tone="muted">
          {email}
        </Text>
      </header>

      <Tabs items={tabs} panelClassName={s.card} />

      <footer className={s.footer}>
        <button
          className={s.signOut}
          disabled={signOut.isPending}
          type="button"
          onClick={() => signOut.mutate()}
        >
          <LogOut size={15} />
          {t('signOut')}
        </button>
      </footer>
    </main>
  );
};
