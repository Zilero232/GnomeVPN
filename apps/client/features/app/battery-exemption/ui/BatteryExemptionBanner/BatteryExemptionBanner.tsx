'use client';

import { BatteryCharging } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Banner, Button } from '@/shared/ui';

import type { BatteryExemptionBannerProps } from './BatteryExemptionBanner.types';

import { useBatteryExemption } from '../../model/hooks';

export const BatteryExemptionBanner = ({ isConnected }: BatteryExemptionBannerProps) => {
  const t = useTranslations('batteryExemption');
  const { isGranted, isRequesting, request } = useBatteryExemption();

  if (isGranted || !isConnected) {
    return null;
  }

  return (
    <Banner
      action={
        <Button disabled={isRequesting} size='md' type='button' onClick={request}>
          {isRequesting ? t('requesting') : t('allow')}
        </Button>
      }
      description={t('description')}
      icon={<BatteryCharging size={16} />}
      title={t('title')}
      tone='warning'
    />
  );
};
