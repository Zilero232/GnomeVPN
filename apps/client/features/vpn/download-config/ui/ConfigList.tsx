'use client';

import { useTranslations } from 'next-intl';

import { useSubscriptionStatus } from '@/entities/billing/subscription';
import { useNodes } from '@/entities/vpn/node';
import { Stack, Text } from '@/shared/ui';
import { CONFIG_LIMIT } from '../config';
import { useConfigs, useIssueConfig, useRevokeConfig } from '../model/hooks';
import { AddConfigForm, ConfigRow } from './components';

import type { ConfigListProps } from './ConfigList.types';

export const ConfigList = ({ className }: ConfigListProps) => {
  const t = useTranslations('configs');
  const { nodes, isLoading: isLoadingNodes } = useNodes();
  const { configs, isLoading: isLoadingConfigs } = useConfigs();
  const { hasAccess } = useSubscriptionStatus();

  const issue = useIssueConfig();
  const revoke = useRevokeConfig();

  const isPending = issue.isPending || revoke.isPending;
  const isFull = configs.length >= CONFIG_LIMIT;

  if (isLoadingNodes || isLoadingConfigs) {
    return <Text tone="muted">{t('loading')}</Text>;
  }

  if (nodes.length === 0) {
    return <Text tone="muted">{t('empty')}</Text>;
  }

  return (
    <Stack className={className} gap="md">
      <Text size="xs" tone="muted">
        {hasAccess ? t('hint', { limit: CONFIG_LIMIT }) : t('lockedHint')}
      </Text>

      {hasAccess && <AddConfigForm isDisabled={isPending || isFull} nodes={nodes} />}

      {isFull && (
        <Text size="xs" tone="muted">
          {t('limitReached', { limit: CONFIG_LIMIT })}
        </Text>
      )}

      {configs.length > 0 && (
        <Stack gap="sm">
          {configs.map((config) => (
            <ConfigRow
              config={config}
              isPending={isPending}
              key={config.id}
              onRedownload={() => issue.mutate({ nodeId: config.nodeId, name: config.name })}
              onRevoke={() => revoke.mutate(config.id)}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
};
