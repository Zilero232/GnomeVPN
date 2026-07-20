'use client';

import { ShieldAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/shared/ui';
import { useServiceStatus } from '../../model/hooks';

import s from './ServiceRepairBanner.module.scss';

export const ServiceRepairBanner = () => {
  const t = useTranslations('service');
  const { isServiceMissing, repair, isRepairing } = useServiceStatus();

  if (!isServiceMissing) {
    return null;
  }

  const onRepair = () => {
    repair(undefined, {
      onError: () => toast.error(t('repairFailed')),
    });
  };

  return (
    <div className={s.root}>
      <div className={s.head}>
        <span className={s.badge}>
          <ShieldAlert size={16} />
        </span>

        <span className={s.title}>{t('title')}</span>
      </div>

      <p className={s.body}>{t('description')}</p>

      <Button
        className={s.action}
        disabled={isRepairing}
        size="md"
        type="button"
        onClick={onRepair}
      >
        {isRepairing ? t('repairing') : t('repair')}
      </Button>
    </div>
  );
};
