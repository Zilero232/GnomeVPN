'use client';

import { intervalToDuration } from 'date-fns';
import { useTranslations } from 'next-intl';
import prettyBytes from 'pretty-bytes';
import { useEffect, useState } from 'react';

import s from './TunnelStats.module.scss';

import type { TunnelStatsProps } from './TunnelStats.types';

const pad = (value = 0) => String(value).padStart(2, '0');

const formatUptime = (from: Date): string => {
  const { hours, minutes, seconds } = intervalToDuration({ start: from, end: new Date() });

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

export const TunnelStats = ({ traffic, connectedAt }: TunnelStatsProps) => {
  const t = useTranslations('app');

  const [uptime, setUptime] = useState('00:00:00');

  useEffect(() => {
    if (!connectedAt) {
      setUptime('00:00:00');

      return;
    }

    setUptime(formatUptime(connectedAt));

    const timer = setInterval(() => setUptime(formatUptime(connectedAt)), 1000);

    return () => clearInterval(timer);
  }, [connectedAt]);

  return (
    <div className={s.root}>
      <div className={s.item}>
        <span className={s.value}>{uptime}</span>
        <span className={s.label}>{t('uptime')}</span>
      </div>

      <div className={s.item}>
        <span className={s.value}>{prettyBytes(traffic.rx)}</span>
        <span className={s.label}>{t('received')}</span>
      </div>

      <div className={s.item}>
        <span className={s.value}>{prettyBytes(traffic.tx)}</span>
        <span className={s.label}>{t('sent')}</span>
      </div>
    </div>
  );
};
