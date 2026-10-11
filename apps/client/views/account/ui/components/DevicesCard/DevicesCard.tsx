'use client';

import { useSubscriptionStatus } from '@/entities/billing/subscription';
import { DevicesPanel } from '@/features/account/manage-devices';
import { ExtraDevicesControl } from '@/features/billing/checkout';

import s from './DevicesCard.module.scss';

export const DevicesCard = () => {
  const { subscription, limits } = useSubscriptionStatus();

  return (
    <div className={s.root}>
      <DevicesPanel />

      {subscription?.period === 'paid' && <ExtraDevicesControl limits={limits} />}
    </div>
  );
};
