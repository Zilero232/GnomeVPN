'use client';

import { TUNNEL_PROTOCOL } from '@gnomevpn/schemas';
import { clsx } from 'clsx';
import { Copy, Download, Share2, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { isTauriMobile } from '@/shared/lib';
import { Badge, Button, CountryFlag, Text } from '@/shared/ui';

import s from './ConfigRow.module.scss';

import type { ConfigRowProps } from './ConfigRow.types';

export const ConfigRow = ({
  config,
  isPending,
  isBlocked = false,
  onCopy,
  onRedownload,
  onRevoke,
}: ConfigRowProps) => {
  const t = useTranslations('configs');

  const isWireguard = config.protocol === TUNNEL_PROTOCOL.wireguard;
  const ShareOrDownload = isTauriMobile() ? Share2 : Download;

  return (
    <div className={clsx(s.root, isBlocked && s.blocked)}>
      <div className={s.body}>
        <CountryFlag countryCode={config.countryCode} />

        <div className={s.info}>
          <span className={s.head}>
            <Text as="span" className={s.name}>
              {config.name}
            </Text>

            {isBlocked ? (
              <Badge tone="muted">{t('paused')}</Badge>
            ) : (
              <Badge>{t(`protocol.${config.protocol}`)}</Badge>
            )}
          </span>

          <Text size="xs" tone="muted">
            {config.country}
          </Text>
        </div>
      </div>

      <div className={s.actions}>
        {isWireguard ? (
          <Button
            aria-label={t(isTauriMobile() ? 'share' : 'redownload')}
            disabled={isPending || isBlocked}
            size="icon"
            variant="ghost"
            onClick={onRedownload}
          >
            <ShareOrDownload aria-hidden size={15} />
          </Button>
        ) : (
          <Button
            aria-label={t('copy')}
            disabled={isPending || isBlocked}
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
