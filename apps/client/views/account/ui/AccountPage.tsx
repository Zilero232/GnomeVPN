'use client';

import { LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import type { TabItem } from '@/shared/ui';

import { useCurrentUser } from '@/entities/auth/user';
import { useSubscriptionStatus } from '@/entities/billing/subscription';
import { useSignOut } from '@/features/auth/sign-out';
import { ConfigList } from '@/features/vpn/download-config';
import { Tabs, Text } from '@/shared/ui';

import { BLOCK_MOTION, HEADER_MOTION, PAGE_MOTION } from './AccountPage.motion';
import { AccountAura, AccountNav, ProfileCard, SubscriptionCard } from './components';

import s from './AccountPage.module.scss';

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
      content: <SubscriptionCard isLoading={isLoading} subscription={subscription} />
    },
    {
      value: 'configs',
      label: tConfigs('title'),
      content: <ConfigList />,
      isBare: true
    },
    {
      value: 'profile',
      label: t('profile.title'),
      content: <ProfileCard />
    }
  ];

  return (
    <>
      <AccountAura />

      <motion.main animate='visible' className={s.root} initial='hidden' variants={PAGE_MOTION}>
        <motion.div variants={BLOCK_MOTION}>
          <AccountNav />
        </motion.div>

        <motion.header className={s.header} variants={HEADER_MOTION}>
          <Text as='h1' className={s.title}>
            {t('title')}
          </Text>
          <Text size='xs' tone='muted'>
            {email}
          </Text>
        </motion.header>

        <motion.div variants={BLOCK_MOTION}>
          <Tabs items={tabs} panelClassName={s.card} />
        </motion.div>

        <motion.footer className={s.footer} variants={BLOCK_MOTION}>
          <button className={s.signOut} disabled={signOut.isPending} type='button' onClick={() => signOut.mutate()}>
            <LogOut size={15} />
            {t('signOut')}
          </button>
        </motion.footer>
      </motion.main>
    </>
  );
};
