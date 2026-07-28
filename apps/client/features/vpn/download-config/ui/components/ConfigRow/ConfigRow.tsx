'use client';

import { TUNNEL_PROTOCOL } from '@gnomevpn/schemas';
import { Copy, Download, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Badge, Button, CountryFlag, Text } from '@/shared/ui';

import s from './ConfigRow.module.scss';

import type { ConfigRowProps } from './ConfigRow.types';

export const ConfigRow = ({
  config,
  isPending,
  onCopy,
  onRedownload,
  onRevoke,
}: ConfigRowProps) => {
  const t = useTranslations('configs');

  const isWireguard = config.protocol === TUNNEL_PROTOCOL.wireguard;

  return (
    <div className={s.root}>
      <div className={s.body}>
        <CountryFlag countryCode={config.countryCode} />

        <div className={s.info}>
          <span className={s.head}>
            <Text as="span" className={s.name}>
              {config.name}
            </Text>

            <Badge>{t(`protocol.${config.protocol}`)}</Badge>
          </span>

          <Text size="xs" tone="muted">
            {config.country}
          </Text>
        </div>
      </div>

      <div className={s.actions}>
        {isWireguard ? (
          <Button
            aria-label={t('redownload')}
            disabled={isPending}
            size="icon"
            variant="ghost"
            onClick={onRedownload}
          >
            <Download aria-hidden size={15} />
          </Button>
        ) : (
          <Button
            aria-label={t('copy')}
            disabled={isPending}
            size="icon"
            variant="ghost"
            onClick={onCopy}
          >
            <Copy aria-hidden size={15} />
          </Button>
        )}

        <Button
          aria-label={t('revoke')}
          disabled={isPending}
          size="icon"
          variant="ghost"
          onClick={onRevoke}
        >
          <Trash2 aria-hidden size={15} />
        </Button>
      </div>
    </div>
  );
};
