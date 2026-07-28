'use client';

import { useTranslations } from 'next-intl';

import { PROTOCOL_OPTIONS } from '@/entities/vpn/protocol';
import { Badge, SelectableCard, Stack, Text } from '@/shared/ui';

import s from './ProtocolPicker.module.scss';

import type { ProtocolControlProps } from '@/entities/vpn/protocol';

export const ProtocolPicker = ({ value, isDisabled, onChange }: ProtocolControlProps) => {
  const t = useTranslations('configs');

  return (
    <Stack className={s.list} gap="sm">
      {PROTOCOL_OPTIONS.map(({ protocol, tagKey, descKey }) => (
        <SelectableCard
          className={s.card}
          disabled={isDisabled}
          isSelected={value === protocol}
          key={protocol}
          onClick={() => onChange(protocol)}
        >
          <Stack className={s.body} gap="sm">
            <span className={s.head}>
              <Text as="span" className={s.name}>
                {t(`protocol.${protocol}`)}
              </Text>
              {tagKey && <Badge>{t(tagKey)}</Badge>}
            </span>

            <Text size="xs" tone="muted">
              {t(descKey)}
            </Text>
          </Stack>
        </SelectableCard>
      ))}
    </Stack>
  );
};
