'use client';

import { clsx } from 'clsx';
import { useTranslations } from 'next-intl';

import { Text } from '@/shared/ui';

import type { LatencyMeterProps } from './LatencyMeter.types';

import { GRADE_BARS, GRADE_LABEL_KEY, SIGNAL_BARS } from '../../../../../config';

import s from './LatencyMeter.module.scss';

export const LatencyMeter = ({ rttMs, grade, isStale }: LatencyMeterProps) => {
  const t = useTranslations('app');

  const bars = GRADE_BARS[grade];

  return (
    <span className={clsx(s.root, s[grade], isStale && s.stale)} title={isStale ? t('nodeLatencyStale') : undefined}>
      <Text as='span' className={s.value}>
        {t('nodeLatency', { value: rttMs })}
      </Text>

      {isStale && (
        <Text as='span' className={s.srOnly}>
          {t('nodeLatencyStale')}
        </Text>
      )}

      <Text as='span' className={s.srOnly}>
        {t(GRADE_LABEL_KEY[grade])}
      </Text>

      <span aria-hidden className={s.signal}>
        {SIGNAL_BARS.map((index) => (
          <span key={index} className={clsx(s.bar, index < bars && s.barOn)} />
        ))}
      </span>
    </span>
  );
};
