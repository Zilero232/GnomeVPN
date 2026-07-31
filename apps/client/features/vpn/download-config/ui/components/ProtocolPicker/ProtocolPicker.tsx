'use client';

import { useTranslations } from 'next-intl';

import type { ProtocolControlProps } from '@/entities/vpn/protocol';

import { PROTOCOL_OPTIONS } from '@/entities/vpn/protocol';
import { Badge, SelectableCard, Stack, Text } from '@/shared/ui';

import s from './ProtocolPicker.module.scss';

export const ProtocolPicker = ({ value, isDisabled, onChange }: ProtocolControlProps) => {
  const t = useTranslations('configs');

  return (
    <div className={s.list}>
      {PROTOCOL_OPTIONS.map(({ protocol, tagKey, descKey }) => (
        <SelectableCard key={protocol} className={s.card} disabled={isDisabled} isSelected={value === protocol} onClick={() => onChange(protocol)}>
          <Stack className={s.body} gap='sm'>
            <span className={s.head}>
              <Text as='span' className={s.name}>
                {t(`protocol.${protocol}`)}
              </Text>
              {tagKey && <Badge>{t(tagKey)}</Badge>}
            </span>

            <Text size='xs' tone='muted'>
              {t(descKey)}
            </Text>
          </Stack>
        </SelectableCard>
      ))}
    </div>
  );
};
