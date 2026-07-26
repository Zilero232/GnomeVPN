'use client';

import { ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Banner, Button } from '@/shared/ui';
import { useVpnPermission } from '../../model/hooks';

import type { VpnPermissionBannerProps } from './VpnPermissionBanner.types';

export const VpnPermissionBanner = ({ isConnected }: VpnPermissionBannerProps) => {
  const t = useTranslations('vpnPermission');
  const { isGranted, isRequesting, request } = useVpnPermission();

  if (isGranted || isConnected) {
    return null;
  }

  return (
    <Banner
      action={
        <Button disabled={isRequesting} size="md" type="button" onClick={request}>
          {isRequesting ? t('requesting') : t('allow')}
        </Button>
      }
      description={t('description')}
      icon={<ShieldCheck size={16} />}
      title={t('title')}
      tone="warning"
    />
  );
};
