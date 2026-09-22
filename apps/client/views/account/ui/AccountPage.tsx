'use client';

import { CreditCard, LogOut, Send, Smartphone, UserRound } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { useSubscriptionStatus } from '@/entities/billing/subscription';
import { useSignOut } from '@/features/auth/sign-out';
import { useVerifyEmailOutcome } from '@/features/auth/verify-email';

import type { AccountTab } from './components';

import { BLOCK_MOTION, HEADER_MOTION, PAGE_MOTION } from './AccountPage.motion';
import { AccountIdentity, AccountTabs, AppCard, ProfileCard, SubscriptionCard, TelegramCard } from './components';

import s from './AccountPage.module.scss';

export const AccountPage = () => {
  const t = useTranslations('account');
  const { subscription, isLoading } = useSubscriptionStatus();

  const signOut = useSignOut();

  useVerifyEmailOutcome();

  const tabs: AccountTab[] = [
    {
      value: 'profile',
      label: t('profile.title'),
      icon: UserRound,
      render: () => <ProfileCard />
    },
    {
      value: 'subscription',
      label: t('tabs.subscription'),
      icon: CreditCard,
      render: () => <SubscriptionCard isLoading={isLoading} subscription={subscription} />
    },
    {
      value: 'telegram',
      label: t('tabs.telegram'),
      icon: Send,
      render: () => <TelegramCard />
    },
    {
      value: 'app',
      label: t('tabs.app'),
      icon: Smartphone,
      render: () => <AppCard />
    }
  ];

  return (
    <motion.main animate='visible' className={s.root} initial='hidden' variants={PAGE_MOTION}>
      <motion.header className={s.header} variants={HEADER_MOTION}>
        <AccountIdentity />

        <button className={s.signOut} disabled={signOut.isPending} type='button' onClick={() => signOut.mutate()}>
          <LogOut aria-hidden size={15} />
          <span className={s.signOutLabel}>{t('signOut')}</span>
        </button>
      </motion.header>

      <motion.div className={s.body} variants={BLOCK_MOTION}>
        <AccountTabs items={tabs} panelClassName={s.card} />
      </motion.div>
    </motion.main>
  );
};
