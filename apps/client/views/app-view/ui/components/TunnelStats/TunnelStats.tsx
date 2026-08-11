'use client';

import { clsx } from 'clsx';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import type { TunnelStatsProps } from './TunnelStats.types';

import { formatBytes, formatSpeed, formatUptime } from '../../../lib';
import { useSpeed } from '../../../model/hooks';
import { VALUE_MOTION } from './TunnelStats.motion';

import s from './TunnelStats.module.scss';

export const TunnelStats = ({ traffic, connectedAt, isVisible }: TunnelStatsProps) => {
  const t = useTranslations('app');

  const speed = useSpeed(traffic);
  const [uptime, setUptime] = useState('00:00:00');

  const isPending = !connectedAt;

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
        <motion.span animate={{ opacity: isPending ? 0.35 : 1 }} className={s.clock} {...VALUE_MOTION}>
          {uptime}
        </motion.span>
      </div>

      <div className={s.grid}>
        <div className={s.row}>
          <ArrowUp aria-hidden className={s.up} size={13} />

          <div className={s.metric}>
            <span className={s.label}>{t('sent')}</span>
            <motion.span animate={{ opacity: isPending ? 0.35 : 1 }} className={s.value} {...VALUE_MOTION}>
              {formatSpeed(speed.tx)}
            </motion.span>
          </div>

          <div className={s.metric}>
            <span className={s.label}>{t('sentTotal')}</span>
            <motion.span animate={{ opacity: isPending ? 0.35 : 1 }} className={s.value} {...VALUE_MOTION}>
              {formatBytes(traffic.tx)}
            </motion.span>
          </div>
        </div>

        <div className={s.row}>
          <ArrowDown aria-hidden className={s.down} size={13} />

          <div className={s.metric}>
            <span className={s.label}>{t('received')}</span>
            <motion.span animate={{ opacity: isPending ? 0.35 : 1 }} className={s.value} {...VALUE_MOTION}>
              {formatSpeed(speed.rx)}
            </motion.span>
          </div>

          <div className={s.metric}>
            <span className={s.label}>{t('receivedTotal')}</span>
            <motion.span animate={{ opacity: isPending ? 0.35 : 1 }} className={s.value} {...VALUE_MOTION}>
              {formatBytes(traffic.rx)}
            </motion.span>
          </div>
        </div>
      </div>
    </div>
  );
};
