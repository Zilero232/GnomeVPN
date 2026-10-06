'use client';

import type { Device } from '@gnomevpn/schemas';

import { Info, TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { deviceName, hasIncyWithoutHwid } from '@/entities/vpn/device';
import { Text } from '@/ui-kit';

import type { DevicesListProps } from './DevicesList.types';

import { useRemoveDevice } from '../../../model/hooks';
import { DeviceRow } from '../DeviceRow';
import { RemoveDeviceDialog } from '../RemoveDeviceDialog';

import s from './DevicesList.module.scss';

export const DevicesList = ({ devices, deviceLimit }: DevicesListProps) => {
  const t = useTranslations('devices');
  const remove = useRemoveDevice();

  const [target, setTarget] = useState<Device | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const hasOverLimit = devices.some((device) => device.isOverLimit);
  const targetName = target ? (deviceName(target) ?? t('unnamed')) : '';

  const onAsk = (device: Device) => {
    setTarget(device);
    setIsConfirmOpen(true);
  };

  const onConfirm = () => {
    if (!target) {
      return;
    }

    remove.mutate(target.id, {
      onSuccess: () => {
        setIsConfirmOpen(false);
        toast.success(t('removed'));
      }
    });
  };

  return (
    <div className={s.root}>
      <header className={s.head}>
        <Text as='h2' className={s.title}>
          {t('title')}
        </Text>

        <Text as='span' className={s.count} data-over-limit={hasOverLimit} size='sm'>
          {t('count', { count: devices.length, limit: deviceLimit })}
        </Text>
      </header>

      <Text size='xs' tone='muted'>
        {t('hint')}
      </Text>

      {hasOverLimit && (
        <p className={s.warning} role='status'>
          <TriangleAlert aria-hidden className={s.warningIcon} size={16} />
          {t('overLimitWarning')}
        </p>
      )}

      {hasIncyWithoutHwid(devices) && (
        <p className={s.tip}>
          <Info aria-hidden className={s.warningIcon} size={16} />
          {t('hwidTip')}
        </p>
      )}

      {devices.length > 0 ? (
        <ul className={s.list}>
          {devices.map((device) => (
            <DeviceRow
              key={device.id}
              device={device}
              isRemoving={remove.isPending && remove.variables === device.id}
              onRemove={() => onAsk(device)}
            />
          ))}
        </ul>
      ) : (
        <div className={s.empty}>
          <Text size='sm' weight='semibold'>
            {t('emptyTitle')}
          </Text>

          <Text size='xs' tone='muted'>
            {t('emptyBody')}
          </Text>
        </div>
      )}

      <RemoveDeviceDialog
        isOpen={isConfirmOpen}
        isPending={remove.isPending}
        name={targetName}
        onConfirm={onConfirm}
        onOpenChange={setIsConfirmOpen}
      />
    </div>
  );
};
