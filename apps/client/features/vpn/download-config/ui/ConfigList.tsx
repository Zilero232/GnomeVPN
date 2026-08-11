'use client';

import { clsx } from 'clsx';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { groupByProp, isEmpty } from 'remeda';

import { useSubscriptionStatus } from '@/entities/billing/subscription';
import { useNodes } from '@/entities/vpn/node';
import { Stack, Text } from '@/shared/ui';

import type { ConfigListProps } from './ConfigList.types';

import { CONFIG_FILTER_ALL, CONFIG_FILTER_ONLINE, FILTER_MIN_CONFIGS } from '../config';
import { useConfigs, useRevokeConfig } from '../model/hooks';
import { AddConfigForm, ConfigFilter, ConfigRow } from './components';

import s from './ConfigList.module.scss';

export const ConfigList = ({ className }: ConfigListProps) => {
  const t = useTranslations('configs');
  const { nodes, isLoading: isLoadingNodes } = useNodes();
  const { configs, isLoading: isLoadingConfigs } = useConfigs();
  const { hasAccess, limits } = useSubscriptionStatus();

  const revoke = useRevokeConfig();
  const [filter, setFilter] = useState(CONFIG_FILTER_ALL);

  const isFull = configs.length >= limits.configLimit;
  const onlineCount = configs.filter((config) => config.isOnline).length;
  const hasFilter = configs.length >= FILTER_MIN_CONFIGS;

  const countries = Object.entries(groupByProp(configs, 'country'))
    .map(([name, matching]) => ({ name, code: matching[0]?.countryCode ?? '', count: matching.length }))
    .sort((left, right) => (left.name < right.name ? -1 : 1));

  const visible = configs.filter((config) => {
    if (!hasFilter || filter === CONFIG_FILTER_ALL) {
      return true;
    }

    return filter === CONFIG_FILTER_ONLINE ? config.isOnline : config.country === filter;
  });

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

          {hasAccess && <AddConfigForm key={configs.length} configs={configs} isDisabled={revoke.isPending} isFull={isFull} nodes={nodes} />}

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

          {hasFilter && (
            <ConfigFilter
              className={s.panelFilter}
              countries={countries}
              isDisabled={revoke.isPending}
              onlineCount={onlineCount}
              total={configs.length}
              value={filter}
              onChange={setFilter}
            />
          )}

          {isEmpty(visible) && (
            <Text size='xs' tone='muted'>
              {t('filterEmpty')}
            </Text>
          )}

          <div className={s.rows}>
            {visible.map((config) => (
              <ConfigRow
                key={config.id}
                config={config}
                isBlocked={!hasAccess}
                isRevoking={revoke.isPending && revoke.variables === config.id}
                onRevoke={() => {
                  if (revoke.isPending) {
                    return;
                  }

                  revoke.mutate(config.id);
                }}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
