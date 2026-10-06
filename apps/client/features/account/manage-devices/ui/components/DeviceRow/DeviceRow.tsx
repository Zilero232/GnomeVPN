'use client';

import { MonitorSmartphone, Trash2 } from 'lucide-react';
import { useFormatter, useNow, useTranslations } from 'next-intl';

import { deviceDetails, deviceName } from '@/entities/vpn/device';
import { Badge, Button, Text } from '@/ui-kit';

import type { DeviceRowProps } from './DeviceRow.types';

import { LAST_SEEN_TICK_MS } from './DeviceRow.constants';

import s from './DeviceRow.module.scss';

export const DeviceRow = ({ device, isRemoving, onRemove }: DeviceRowProps) => {
  const t = useTranslations('devices');
  const format = useFormatter();
  const now = useNow({ updateInterval: LAST_SEEN_TICK_MS });

  const name = deviceName(device) ?? t('unnamed');
  const details = deviceDetails(device);

  return (
    <li className={s.root} data-over-limit={device.isOverLimit}>
      <span aria-hidden className={s.icon}>
        <MonitorSmartphone size={16} />
      </span>

      <div className={s.body}>
        <div className={s.titleRow}>
          <Text truncate as='span' className={s.name} size='sm' weight='semibold'>
            {name}
          </Text>

          {device.isOverLimit && <Badge tone='danger'>{t('overLimit')}</Badge>}
        </div>

        {details.length > 0 && (
          <Text truncate as='span' size='xs' tone='muted'>
            {details.join(' · ')}
          </Text>
        )}

        <Text as='span' size='xs' tone='muted'>
          {t('lastSeen', { time: format.relativeTime(new Date(device.lastSeenAt), now) })}
        </Text>
      </div>

      <Button aria-haspopup='dialog' aria-label={t('removeLabel', { name })} disabled={isRemoving} size='md' variant='ghost' onClick={onRemove}>
        <Trash2 aria-hidden size={15} />
        <span className={s.removeText}>{t('remove')}</span>
      </Button>
    </li>
  );
};
