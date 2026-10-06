import { useTranslations } from 'next-intl';

import { CountryFlag, Text } from '@/ui-kit';

import { LOCATIONS } from '../../../config';

import s from './Locations.module.scss';

export const Locations = () => {
  const t = useTranslations('landing.locations');

  return (
    <ul className={s.grid}>
      {LOCATIONS.map((location) => (
        <li key={location.code} className={s.card}>
          <CountryFlag className={s.flag} countryCode={location.code} size='lg' />

          <div className={s.body}>
            <Text as='h3' className={s.name}>
              {t(`${location.key}Name`)}
            </Text>
            <Text as='p' className={s.city}>
              {t(`${location.key}City`)}
            </Text>
          </div>

          <span aria-hidden className={s.pulse} />
        </li>
      ))}
    </ul>
  );
};
