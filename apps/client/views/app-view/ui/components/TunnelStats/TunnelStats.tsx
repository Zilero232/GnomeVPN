'use client';

import { clsx } from 'clsx';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { formatBytes, formatSpeed, formatUptime } from '../../../lib';
import { useSpeed } from '../../../model/hooks';

import s from './TunnelStats.module.scss';

import type { TunnelStatsProps } from './TunnelStats.types';

export const TunnelStats = ({ traffic, connectedAt, isVisible }: TunnelStatsProps) => {
  const t = useTranslations('app');

  const speed = useSpeed(traffic);
  const [uptime, setUptime] = useState('00:00:00');

  useEffect(() => {
    if (!connectedAt || !isVisible) {
      setUptime('00:00:00');

      return;
    }

    setUptime(formatUptime(connectedAt));

    const timer = setInterval(() => setUptime(formatUptime(connectedAt)), 1000);

    return () => clearInterval(timer);
  }, [connectedAt, isVisible]);

  return (
    <div aria-hidden={!isVisible} className={clsx(s.root, !isVisible && s.hidden)}>
      <div className={s.uptime}>
        <span className={s.label}>{t('uptime')}</span>
        <span className={s.clock}>{uptime}</span>
      </div>

      <div className={s.grid}>
        <div className={s.row}>
          <ArrowUp aria-hidden className={s.up} size={13} />

          <div className={s.metric}>
            <span className={s.label}>{t('sent')}</span>
            <span className={s.value}>{formatSpeed(speed.tx)}</span>
          </div>

          <div className={s.metric}>
            <span className={s.label}>{t('sentTotal')}</span>
            <span className={s.value}>{formatBytes(traffic.tx)}</span>
          </div>
        </div>

        <div className={s.row}>
          <ArrowDown aria-hidden className={s.down} size={13} />

          <div className={s.metric}>
            <span className={s.label}>{t('received')}</span>
            <span className={s.value}>{formatSpeed(speed.rx)}</span>
          </div>

          <div className={s.metric}>
            <span className={s.label}>{t('receivedTotal')}</span>
            <span className={s.value}>{formatBytes(traffic.rx)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
