'use client';

import { TUNNEL_PROTOCOL } from '@gnomevpn/schemas';
import { clsx } from 'clsx';
import { Copy, Download, QrCode, Share2, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { usePlatform } from '@/entities/app/platform';
import { Badge, Button, CountryFlag, Text } from '@/shared/ui';

import type { ConfigRowProps } from './ConfigRow.types';

import { useConfigMaterial } from '../../../model/hooks';
import { ConfigQrDialog } from '../ConfigQrDialog';

import s from './ConfigRow.module.scss';

export const ConfigRow = ({ config, isBlocked = false, isRevoking, onRevoke }: ConfigRowProps) => {
  const t = useTranslations('configs');
  const { content, isPending, download, copyToClipboard, prepareQr } = useConfigMaterial({
    config
  });

  const [isQrOpen, setIsQrOpen] = useState(false);

  const { isMobileApp } = usePlatform();

  const isWireguard = config.protocol === TUNNEL_PROTOCOL.wireguard;
  const ShareOrDownload = isMobileApp ? Share2 : Download;

  const isBusy = isPending || isRevoking;

  const openQr = () => {
    setIsQrOpen(true);
    prepareQr();
  };

  return (
    <div className={clsx(s.root, isBlocked && s.blocked)}>
      <div className={s.body}>
        <CountryFlag countryCode={config.countryCode} />

        <div className={s.info}>
          <span className={s.head}>
            <Text as='span' className={s.name}>
              {config.name}
            </Text>

            {isBlocked ? <Badge tone='muted'>{t('paused')}</Badge> : <Badge>{t(`protocol.${config.protocol}`)}</Badge>}

            {config.isOnline && <Badge tone='accent'>{t('connected')}</Badge>}
          </span>

          <Text size='xs' tone='muted'>
            {config.country}
          </Text>
        </div>
      </div>

      <div className={s.actions}>
        <Button aria-label={t('qr')} disabled={isBusy || isBlocked} size='icon' variant='ghost' onClick={openQr}>
          <QrCode aria-hidden size={15} />
        </Button>

        {isWireguard ? (
          <Button aria-label={t(isMobileApp ? 'share' : 'redownload')} disabled={isBusy || isBlocked} size='icon' variant='ghost' onClick={download}>
            <ShareOrDownload aria-hidden size={15} />
          </Button>
        ) : (
          <Button aria-label={t('copy')} disabled={isBusy || isBlocked} size='icon' variant='ghost' onClick={copyToClipboard}>
            <Copy aria-hidden size={15} />
          </Button>
        )}

        <Button aria-label={t('revoke')} disabled={isBusy} size='icon' variant='ghost' onClick={onRevoke}>
          <Trash2 aria-hidden size={15} />
        </Button>
      </div>

      <ConfigQrDialog config={config} content={content} isOpen={isQrOpen} onOpenChange={setIsQrOpen} />
    </div>
  );
};
