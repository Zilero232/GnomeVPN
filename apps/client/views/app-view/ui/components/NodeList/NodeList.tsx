'use client';

import { clsx } from 'clsx';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { match } from 'ts-pattern';

import { CountryFlag } from '@/shared/ui';

import s from './NodeList.module.scss';

import type { NodeListProps } from './NodeList.types';

const STATUS_LABEL = {
  online: 'nodeOnline',
  degraded: 'nodeDegraded',
  offline: 'nodeOffline',
} as const;

export const NodeList = ({
  nodes,
  activeNodeId,
  isLoading,
  isError,
  isLocked,
  onSelect,
}: NodeListProps) => {
  const t = useTranslations('app');

  const hint = match({ isLoading, isError, isEmpty: nodes.length === 0 })
    .with({ isLoading: true }, () => t('nodesLoading'))
    .with({ isError: true }, () => t('nodesError'))
    .with({ isEmpty: true }, () => t('nodesEmpty'))
    .otherwise(() => null);

  return (
    <section className={s.root}>
      {hint && <p className={s.hint}>{hint}</p>}

      {nodes.map((node, index) => {
        const isOffline = node.status === 'offline';

        return (
          <motion.button
            animate={{ opacity: 1, y: 0 }}
            className={clsx(
              s.node,
              activeNodeId === node.id && s.nodeActive,
              isOffline && s.nodeOffline,
            )}
            disabled={isLocked || isOffline}
            initial={{ opacity: 0, y: 8 }}
            key={node.id}
            title={isOffline ? t('nodeOfflineHint') : undefined}
            transition={{ delay: index * 0.05, type: 'spring', stiffness: 400, damping: 28 }}
            type="button"
            whileTap={isLocked || isOffline ? undefined : { scale: 0.98 }}
            onClick={() => onSelect(node.id)}
          >
            {activeNodeId === node.id && (
              <motion.span className={s.marker} layoutId="node-marker" />
            )}

            <CountryFlag countryCode={node.countryCode} />
            <span className={s.country}>{node.country}</span>

            <span className={clsx(s.status, s[node.status])} title={t(STATUS_LABEL[node.status])}>
              <span className={s.statusDot} />
            </span>
          </motion.button>
        );
      })}
    </section>
  );
};
