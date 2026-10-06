'use client';

import { DevicesPanel } from '@/features/account/manage-devices';
import { ExtraDevicesControl } from '@/features/billing/checkout';

import type { DevicesCardProps } from './DevicesCard.types';

import s from './DevicesCard.module.scss';

export const DevicesCard = ({ limits }: DevicesCardProps) => (
  <div className={s.root}>
    <DevicesPanel />

    <ExtraDevicesControl limits={limits} />
  </div>
);
