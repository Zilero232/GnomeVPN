'use client';

import { useMediaQuery } from '@siberiacancode/reactuse';
import { Copy, Download, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { isNonNullish } from 'remeda';

import { CLIENT_ICONS } from '@/entities/app/incy';
import { Text } from '@/ui-kit';

import type { OtherAppsListProps } from './OtherAppsList.types';

import { TOUCH_DEVICE_QUERY } from './OtherAppsList.constants';

import s from './OtherAppsList.module.scss';

export const OtherAppsList = ({ clients, url, onCopy }: OtherAppsListProps) => {
  const t = useTranslations('incy');
  const isTouchDevice = useMediaQuery(TOUCH_DEVICE_QUERY);

  const others = clients.filter((client) => !client.isRecommended);

  return (
    <div className={s.root}>
      <Text size='xs' tone='muted'>
        {isTouchDevice ? t('otherAppsHint') : t('otherAppsDesktopHint')}
      </Text>

      <ul className={s.list}>
        {others.map(({ id, importUrl, downloadUrl, platforms }) => {
          const Icon = CLIENT_ICONS[id];
          const canImport = isTouchDevice && isNonNullish(importUrl);

          return (
            <li key={id} className={s.item}>
              <Icon aria-hidden className={s.icon} size={18} />

              <span className={s.body}>
                <Text as='span' className={s.name} size='sm'>
                  {t(`clients.${id}`)}
                </Text>

                <span className={s.meta}>
                  <Text as='span' size='xs' tone='muted'>
                    {platforms.map((platform) => t(`platformNames.${platform}`)).join(' · ')}
                  </Text>

                  <a className={s.download} href={downloadUrl} rel='noopener noreferrer' target='_blank'>
                    <Download aria-hidden size={12} />
                    {t('clientDownload')}
                  </a>
                </span>
              </span>

              {canImport ? (
                <a className={s.import} href={importUrl}>
                  <ExternalLink aria-hidden size={14} />
                  {t('clientImport')}
                </a>
              ) : (
                <button className={s.import} type='button' onClick={() => onCopy({ value: url, message: t('urlCopied'), id })}>
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
