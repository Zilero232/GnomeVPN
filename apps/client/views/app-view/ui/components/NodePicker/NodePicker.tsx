'use client';

import { clsx } from 'clsx';
import { useTranslations } from 'next-intl';
import { isNonNullish, sortBy } from 'remeda';
import { match } from 'ts-pattern';

import { CountryFlag, Select, Text } from '@/shared/ui';

import type { NodePickerProps } from './NodePicker.types';

import { STATUS_LABEL } from '../../../config';
import { gradeLatency } from '../../../lib';

import s from './NodePicker.module.scss';

export const NodePicker = ({ nodes, activeNodeId, isLoading, isError, isLocked, latency = {}, onSelect }: NodePickerProps) => {
  const t = useTranslations('app');

  const statusPlaceholder = match({ isLoading, isError, isEmpty: nodes.length === 0 })
    .with({ isLoading: true }, () => t('nodesLoading'))
    .with({ isError: true }, () => t('nodesError'))
    .with({ isEmpty: true }, () => t('nodesEmpty'))
    .otherwise(() => null);

  const isRanked = nodes.some((node) => isNonNullish(latency[node.id]));

  const ordered = isRanked
    ? sortBy(
        nodes,
        (node) => node.status === 'offline',
        (node) => latency[node.id] ?? Number.POSITIVE_INFINITY
      )
    : nodes;

  const GRADE_LABEL = {
    fast: t('nodeGradeFast'),
    fair: t('nodeGradeFair'),
    slow: t('nodeGradeSlow')
  } as const;

  const options = ordered.map((node) => {
    const rttMs = latency[node.id] ?? null;
    const grade = isNonNullish(rttMs) ? gradeLatency(rttMs) : null;
    const bars = grade === 'fast' ? 3 : grade === 'fair' ? 2 : 1;
    const isOnline = node.status !== 'offline';
    const isActive = node.id === activeNodeId;

    return {
      value: node.id,
      isDisabled: node.status === 'offline',
      title: node.status === 'offline' ? t('nodeOfflineHint') : t(STATUS_LABEL[node.status]),
      label: (
        <span className={clsx(s.option, isActive && s.optionActive, !isOnline && s.optionOff)}>
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

          {isOnline && isNonNullish(rttMs) ? (
            <span className={clsx(s.meter, grade && s[grade], isLocked && s.meterStale)} title={isLocked ? t('nodeLatencyStale') : undefined}>
              <Text as='span' className={s.latency}>
                {t('nodeLatency', { value: rttMs })}
              </Text>

              {isLocked && (
                <Text as='span' className={s.srOnly}>
                  {t('nodeLatencyStale')}
                </Text>
              )}

              {grade && (
                <Text as='span' className={s.srOnly}>
                  {GRADE_LABEL[grade]}
                </Text>
              )}

              <span aria-hidden className={s.signal}>
                {[0, 1, 2].map((index) => (
                  <span key={index} className={clsx(s.bar, index < bars && s.barOn)} />
                ))}
              </span>
            </span>
          ) : (
            <Text as='span' className={s.offlineTag}>
              {t(STATUS_LABEL[node.status])}
            </Text>
          )}
        </span>
      )
    };
  });

  return (
    <div className={s.root}>
      <Text as='span' className={s.label}>
        {t('nodeLabel')}
      </Text>

      <Select
        aria-label={t('nodeLabel')}
        isDisabled={isLocked || isNonNullish(statusPlaceholder)}
        options={options}
        placeholder={statusPlaceholder ?? t('nodePlaceholder')}
        value={activeNodeId ?? ''}
        onChange={onSelect}
      />
    </div>
  );
};
