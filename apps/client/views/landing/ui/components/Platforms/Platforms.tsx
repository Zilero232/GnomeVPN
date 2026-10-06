import { useTranslations } from 'next-intl';

import { usePlatforms } from '@/entities/app/incy';
import { Text } from '@/ui-kit';

import s from './Platforms.module.scss';

export const Platforms = () => {
  const t = useTranslations('landing.platforms');
  const tIncy = useTranslations('incy.platforms');
  const platforms = usePlatforms();

  return (
    <ul className={s.list}>
      {platforms.map(({ id, icon: Icon }) => (
        <li key={id} className={s.row}>
          <Icon aria-hidden className={s.icon} size={18} strokeWidth={1.7} />

          <Text as='h3' className={s.name}>
            {tIncy(id)}
          </Text>

          <Text as='p' className={s.body}>
            {t(`${id}Body`)}
          </Text>
        </li>
      ))}
    </ul>
  );
};
