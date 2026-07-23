'use client';

import { ArrowDownToLine } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { SITE } from '@/shared/config';
import { DOWNLOAD_HASH } from '@/shared/constants';
import { openExternal } from '@/shared/lib';
import { Button } from '@/shared/ui';
import { useMobileUpdate } from '../../../model/hooks';

import s from './MobileUpdateBanner.module.scss';

export const MobileUpdateBanner = () => {
  const t = useTranslations('update');
  const update = useMobileUpdate();

  if (!update.hasUpdate) {
    return null;
  }

  return (
    <div className={s.root}>
      <div className={s.head}>
        <span className={s.badge}>
          <ArrowDownToLine size={16} />
        </span>

        <span className={s.title}>{t('mobileTitle', { version: update.version })}</span>
      </div>

      <p className={s.body}>{t('mobileBody')}</p>

      <Button
        className={s.action}
        size="md"
        type="button"
        onClick={() => openExternal(`${SITE.url}${DOWNLOAD_HASH}`)}
      >
        {t('mobileAction')}
      </Button>
    </div>
  );
};
