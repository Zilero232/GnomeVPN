'use client';

import { ArrowDownToLine } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { SITE } from '@/shared/config';
import { DOWNLOAD_HASH } from '@/shared/constants';
import { openExternal } from '@/shared/lib';
import { Banner, Button } from '@/shared/ui';
import { useMobileUpdate } from '../../../model/hooks';

export const MobileUpdateBanner = () => {
  const t = useTranslations('update');
  const update = useMobileUpdate();

  if (!update.hasUpdate) {
    return null;
  }

  return (
    <Banner
      action={
        <Button size="md" type="button" onClick={() => openExternal(`${SITE.url}${DOWNLOAD_HASH}`)}>
          {t('mobileAction')}
        </Button>
      }
      description={t('mobileBody')}
      icon={<ArrowDownToLine size={16} />}
      title={t('mobileTitle', { version: update.version })}
      tone="accent"
    />
  );
};
