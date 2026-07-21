'use client';

import { useTranslations } from 'next-intl';

import { notify } from '@/shared/lib';

export const useTunnelNotifications = () => {
  const t = useTranslations('notifications');

  const notifyConnected = async (country: string) => {
    await notify({
      title: t('connectedTitle'),
      body: t('connectedBody', { country }),
      tone: 'success',
    });
  };

  const notifyDisconnected = async () => {
    await notify({ title: t('disconnectedTitle'), body: t('disconnectedBody') });
  };

  const notifyError = async (message: string) => {
    await notify({ title: t('errorTitle'), body: message, tone: 'error' });
  };

  return { notifyConnected, notifyDisconnected, notifyError };
};
