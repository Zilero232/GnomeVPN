'use client';

import { useMediaQuery } from '@siberiacancode/reactuse';
import { Copy, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { isNonNullish } from 'remeda';

import { CLIENT_ICONS } from '@/entities/app/incy';
import { Text } from '@/ui-kit';

import type { ImportInput, OtherAppsListProps } from './OtherAppsList.types';

import { TOUCH_DEVICE_QUERY } from './OtherAppsList.constants';

import s from './OtherAppsList.module.scss';

export const OtherAppsList = ({ clients, url, onCopy }: OtherAppsListProps) => {
  const t = useTranslations('incy');
  const isTouchDevice = useMediaQuery(TOUCH_DEVICE_QUERY);

  const others = clients.filter((client) => !client.isRecommended);

  const onImport = async ({ importUrl, id }: ImportInput) => {
    await onCopy({ value: url, message: t('importCopied'), id });

    window.location.href = importUrl;
  };

  return (
    <div className={s.root}>
      <Text size='xs' tone='muted'>
        {isTouchDevice ? t('otherAppsHint') : t('otherAppsDesktopHint')}
      </Text>

      <ul className={s.list}>
        {others.map(({ id, importUrl, platforms }) => {
          const Icon = CLIENT_ICONS[id];
          const canImport = isTouchDevice && isNonNullish(importUrl);

          return (
            <li key={id} className={s.item}>
              <Icon aria-hidden className={s.icon} size={18} />

              <span className={s.body}>
                <Text as='span' className={s.name} size='sm'>
                  {t(`clients.${id}`)}
                </Text>

                <Text as='span' className={s.platforms} size='xs' tone='muted'>
                  {platforms.map((platform) => t(`platformNames.${platform}`)).join(' · ')}
                </Text>
              </span>

              {canImport ? (
                <button className={s.import} type='button' onClick={() => void onImport({ importUrl, id })}>
                  <ExternalLink aria-hidden size={14} />
                  {t('clientImport')}
                </button>
              ) : (
                <button className={s.import} type='button' onClick={() => void onCopy({ value: url, message: t('urlCopied'), id })}>
                  <Copy aria-hidden size={14} />
                  {t('clientCopy')}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
