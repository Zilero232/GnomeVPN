'use client';

import { useTranslations } from 'next-intl';
import { isNonNullish, sortBy } from 'remeda';
import { match } from 'ts-pattern';

import { Select, Text } from '@/shared/ui';

import type { NodePickerProps } from './NodePicker.types';

import { nodeLabelKeys, resolveReachability } from '../../../lib';
import { NodeOption } from './components';

import s from './NodePicker.module.scss';

export const NodePicker = ({ nodes, activeNodeId, isLoading, isError, isLocked, isMeasuring = false, latency = {}, onSelect }: NodePickerProps) => {
  const t = useTranslations('app');

  const statusPlaceholder = match({ isLoading, isError, isEmpty: nodes.length === 0 })
    .with({ isLoading: true }, () => t('nodesLoading'))
    .with({ isError: true }, () => t('nodesError'))
    .with({ isEmpty: true }, () => t('nodesEmpty'))
    .otherwise(() => null);

  const isRanked = nodes.some((node) => isNonNullish(latency[node.id]));

  const entries = nodes.map((node) => ({
    node,
    rttMs: latency[node.id] ?? null,
    reachability: resolveReachability({ node, latency, isMeasuring })
  }));

  const ordered = isRanked
    ? sortBy(
        entries,
        (entry) => entry.reachability === 'unreachable',
        (entry) => entry.rttMs ?? Number.POSITIVE_INFINITY
      )
    : entries;

  const options = ordered.map(({ node, rttMs, reachability }) => ({
    value: node.id,
    isDisabled: reachability === 'unreachable',
    title: t(nodeLabelKeys({ reachability, status: node.status }).hint),
    label: <NodeOption isActive={node.id === activeNodeId} isStale={isLocked} node={node} reachability={reachability} rttMs={rttMs} />
  }));

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
