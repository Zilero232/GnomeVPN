'use client';

import { useTranslations } from 'next-intl';

import { useDevices } from '@/entities/vpn/device';
import { ErrorBlock, LoadingBlock } from '@/ui-kit';

import { DevicesList } from './components';

export const DevicesPanel = () => {
  const t = useTranslations('devices');
  const { data: list, isPending, isError, isRefetching, refetch } = useDevices();

  if (isPending) {
    return <LoadingBlock label={t('loading')} />;
  }

  if (isError) {
    return <ErrorBlock isRetrying={isRefetching} message={t('unavailable')} retryLabel={t('retry')} onRetry={() => void refetch()} />;
  }

  return <DevicesList deviceLimit={list.deviceLimit} devices={list.devices} />;
};
