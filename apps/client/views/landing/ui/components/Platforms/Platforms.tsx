'use client';

import { useTranslations } from 'next-intl';

import { Text } from '@/shared/ui';
import { PLATFORMS } from '../../../config';

import s from './Platforms.module.scss';

export const Platforms = () => {
  const t = useTranslations('landing.platforms');

  return (
    <div className={s.grid}>
      {PLATFORMS.map((platform) => (
        <article className={s.card} data-native={platform.isNative} key={platform.key}>
          <Text as="span" className={s.badge}>
            {t(platform.isNative ? 'native' : 'config')}
          </Text>
          <Text as="h3" className={s.name}>
            {platform.name}
          </Text>
          <Text as="p" className={s.body}>
            {t(`${platform.key}Body`)}
          </Text>
        </article>
      ))}
    </div>
  );
};
