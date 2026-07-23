'use client';

import { clsx } from 'clsx';
import { useTranslations } from 'next-intl';
import { isNonNullish, sortBy } from 'remeda';
import { match } from 'ts-pattern';

import { CountryFlag, Select, Text } from '@/shared/ui';
import { STATUS_LABEL } from '../../../config';
import { gradeLatency } from '../../../lib';

import s from './NodePicker.module.scss';

import type { NodePickerProps } from './NodePicker.types';

export const NodePicker = ({
  nodes,
  activeNodeId,
  isLoading,
  isError,
  isLocked,
  latency = {},
  onSelect,
}: NodePickerProps) => {
  const t = useTranslations('app');

  const hint = match({ isLoading, isError, isEmpty: nodes.length === 0 })
    .with({ isLoading: true }, () => t('nodesLoading'))
    .with({ isError: true }, () => t('nodesError'))
    .with({ isEmpty: true }, () => t('nodesEmpty'))
    .otherwise(() => null);

  if (hint) {
    return (
      <Text size="xs" tone="muted">
        {hint}
      </Text>
    );
  }

  const isRanked = nodes.some((node) => isNonNullish(latency[node.id]));

  const ordered = isRanked
    ? sortBy(
        nodes,
        (node) => node.status === 'offline',
        (node) => latency[node.id] ?? Number.POSITIVE_INFINITY,
      )
    : nodes;

  const options = ordered.map((node) => {
    const rttMs = latency[node.id] ?? null;

    return {
      value: node.id,
      isDisabled: node.status === 'offline',
      title: node.status === 'offline' ? t('nodeOfflineHint') : t(STATUS_LABEL[node.status]),
      label: (
        <span className={s.option}>
          <CountryFlag countryCode={node.countryCode} />

          <span className={s.country}>{node.country}</span>

          {node.city && <span className={s.city}>{node.city}</span>}

          {node.status !== 'offline' && (
            <span
              aria-hidden={rttMs === null}
              className={clsx(
                s.latency,
                rttMs !== null && [s.latencyReady, s[gradeLatency(rttMs)]],
              )}
            >
              {rttMs !== null && t('nodeLatency', { value: rttMs })}
            </span>
          )}

          <span className={clsx(s.dot, s[node.status])} />
        </span>
      ),
    };
  });

  return (
    <div className={s.root}>
      <span className={s.label}>{t('nodeLabel')}</span>

      <Select
        aria-label={t('nodeLabel')}
        isDisabled={isLocked}
        options={options}
        placeholder={t('nodePlaceholder')}
        value={activeNodeId ?? ''}
        onChange={onSelect}
      />
    </div>
  );
};
