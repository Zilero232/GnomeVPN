'use client';

import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useCurrentUser } from '@/entities/auth/user';
import { useSubscriptionStatus } from '@/entities/billing/subscription';
import { useSignOut } from '@/features/auth/sign-out';
import { Text } from '@/shared/ui';
import { AccountNav, SubscriptionCard } from './components';

import s from './AccountPage.module.scss';

export const AccountPage = () => {
  const t = useTranslations('account');
  const { email } = useCurrentUser();
  const { subscription, isLoading } = useSubscriptionStatus();

  const signOut = useSignOut();

  return (
    <main className={s.root}>
      <AccountNav />

      <header className={s.header}>
        <h1 className={s.title}>{t('title')}</h1>
        <Text size="xs" tone="muted">
          {email}
        </Text>
      </header>

      <div className={s.card}>
        <SubscriptionCard isLoading={isLoading} subscription={subscription} />
      </div>

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
