'use client';

import { ShieldAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Banner, Button } from '@/shared/ui';
import { useServiceStatus } from '../../model/hooks';

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
    <Banner
      action={
        <Button disabled={isRepairing} size="md" type="button" onClick={onRepair}>
          {isRepairing ? t('repairing') : t('repair')}
        </Button>
      }
      description={t('description')}
      icon={<ShieldAlert size={16} />}
      title={t('title')}
      tone="danger"
    />
  );
};
