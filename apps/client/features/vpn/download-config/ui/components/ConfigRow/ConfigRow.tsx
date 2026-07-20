'use client';

import { Download, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button, CountryFlag, Text } from '@/shared/ui';

import s from './ConfigRow.module.scss';

import type { ConfigRowProps } from './ConfigRow.types';

export const ConfigRow = ({ config, isPending, onRedownload, onRevoke }: ConfigRowProps) => {
  const t = useTranslations('configs');

  return (
    <div className={s.root}>
      <div className={s.body}>
        <CountryFlag countryCode={config.countryCode} />

        <div className={s.info}>
          <span className={s.name}>{config.name}</span>

          <Text size="xs" tone="muted">
            {config.country}
          </Text>
        </div>
      </div>

      <div className={s.actions}>
        <Button
          aria-label={t('redownload')}
          disabled={isPending}
          size="icon"
          variant="ghost"
          onClick={onRedownload}
        >
          <Download aria-hidden size={15} />
        </Button>

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
