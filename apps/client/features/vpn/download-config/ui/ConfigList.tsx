'use client';

import { clsx } from 'clsx';
import { useTranslations } from 'next-intl';
import { isEmpty } from 'remeda';

import { useSubscriptionStatus } from '@/entities/billing/subscription';
import { useNodes } from '@/entities/vpn/node';
import { Stack, Text } from '@/shared/ui';

import type { ConfigListProps } from './ConfigList.types';

import { useConfigs, useRevokeConfig } from '../model/hooks';
import { AddConfigForm, ConfigRow } from './components';

import s from './ConfigList.module.scss';

export const ConfigList = ({ className }: ConfigListProps) => {
  const t = useTranslations('configs');
  const { nodes, isLoading: isLoadingNodes } = useNodes();
  const { configs, isLoading: isLoadingConfigs } = useConfigs();
  const { hasAccess, limits } = useSubscriptionStatus();

  const revoke = useRevokeConfig();

  const isFull = configs.length >= limits.configLimit;

  if (isLoadingNodes || isLoadingConfigs || isEmpty(nodes)) {
    return (
      <section className={clsx(s.panel, className)}>
        <Text tone='muted'>{isLoadingNodes || isLoadingConfigs ? t('loading') : t('empty')}</Text>
      </section>
    );
  }

  return (
    <div className={clsx(s.root, className)}>
      <section className={s.panel}>
        <Stack gap='md'>
          <Text size='xs' tone='muted'>
            {hasAccess ? t('hint', { limit: limits.configLimit }) : t('lockedHint')}
          </Text>

          {hasAccess && (
            <AddConfigForm
              key={configs.length}
              configs={configs}
              isDisabled={revoke.isPending}
              isFull={isFull}
              nodes={nodes}
            />
          )}

          {isFull && (
            <Text size='xs' tone='muted'>
              {t('limitReached', { limit: limits.configLimit })}
            </Text>
          )}
        </Stack>
      </section>

      {!isEmpty(configs) && (
        <section className={s.panel}>
          <header className={s.panelHead}>
            <Text as='h3' className={s.panelTitle}>
              {t('issued')}
            </Text>

            <Text as='span' className={s.counter}>
              {configs.length} / {limits.configLimit}
            </Text>
          </header>

          {!hasAccess && (
            <Text className={s.expiredNotice} size='xs' tone='danger'>
              {t('expiredNotice')}
            </Text>
          )}

          <div className={s.rows}>
            {configs.map((config) => (
              <ConfigRow
                key={config.id}
                config={config}
                isBlocked={!hasAccess}
                isRevoking={revoke.isPending}
                onRevoke={() => revoke.mutate(config.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
