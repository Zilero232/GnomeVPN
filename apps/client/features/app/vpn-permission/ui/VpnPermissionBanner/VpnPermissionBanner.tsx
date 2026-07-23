'use client';

import { ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/shared/ui';
import { useVpnPermission } from '../../model/hooks';

import s from './VpnPermissionBanner.module.scss';

export const VpnPermissionBanner = () => {
  const t = useTranslations('vpnPermission');
  const { isGranted, isRequesting, request } = useVpnPermission();

  if (isGranted) {
    return null;
  }

  return (
    <div className={s.root}>
      <div className={s.head}>
        <span className={s.badge}>
          <ShieldCheck size={16} />
        </span>

        <span className={s.title}>{t('title')}</span>
      </div>

      <p className={s.body}>{t('description')}</p>

      <Button
        className={s.action}
        disabled={isRequesting}
        size="md"
        type="button"
        onClick={request}
      >
        {isRequesting ? t('requesting') : t('allow')}
      </Button>
    </div>
  );
};
