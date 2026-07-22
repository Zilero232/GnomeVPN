'use client';

import { clsx } from 'clsx';
import { useTranslations } from 'next-intl';
import { match } from 'ts-pattern';

import { CountryFlag, Select, Text } from '@/shared/ui';

import s from './NodePicker.module.scss';

import type { NodePickerProps } from './NodePicker.types';

const STATUS_LABEL = {
  online: 'nodeOnline',
  degraded: 'nodeDegraded',
  offline: 'nodeOffline',
} as const;

export const NodePicker = ({
  nodes,
  activeNodeId,
  isLoading,
  isError,
  isLocked,
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

  const options = nodes.map((node) => ({
    value: node.id,
    isDisabled: node.status === 'offline',
    title: node.status === 'offline' ? t('nodeOfflineHint') : t(STATUS_LABEL[node.status]),
    label: (
      <span className={s.option}>
        <CountryFlag countryCode={node.countryCode} />

        <span className={s.country}>{node.country}</span>

        {node.city && <span className={s.city}>{node.city}</span>}

        <span className={clsx(s.dot, s[node.status])} />
      </span>
    ),
  }));

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
