'use client';

import { clsx } from 'clsx';
import { useTranslations } from 'next-intl';
import { isNonNullish } from 'remeda';

import { CountryFlag, Text } from '@/shared/ui';

import type { NodeOptionProps } from './NodeOption.types';

import { gradeLatency, nodeLabelKeys } from '../../../../../lib';
import { LatencyMeter } from '../LatencyMeter';

import s from './NodeOption.module.scss';

export const NodeOption = ({ node, reachability, rttMs, isActive, isStale }: NodeOptionProps) => {
  const t = useTranslations('app');

  const isReachable = reachability !== 'unreachable';
  const { tag } = nodeLabelKeys({ reachability, status: node.status });

  return (
    <span className={clsx(s.root, isActive && s.active, !isReachable && s.off)}>
      <span aria-hidden className={s.rail} />

      {isActive && (
        <Text as='span' className={s.srOnly}>
          {t('nodeActive')}
        </Text>
      )}

      <span className={s.flag}>
        <CountryFlag countryCode={node.countryCode} />
      </span>

      <span className={s.place}>
        <Text as='span' className={s.country}>
          {node.country}
        </Text>

        {node.city && (
          <Text as='span' className={s.city}>
            {node.city}
          </Text>
        )}
      </span>

      {isReachable && isNonNullish(rttMs) ? (
        <LatencyMeter grade={gradeLatency(rttMs)} isStale={isStale} rttMs={rttMs} />
      ) : (
        <Text as='span' className={s.tag}>
          {t(tag)}
        </Text>
      )}
    </span>
  );
};
