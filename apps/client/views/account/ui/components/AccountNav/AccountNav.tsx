'use client';

import { useTranslations } from 'next-intl';

import { LocaleSwitcher } from '@/features/app/switch-locale';
import { ROUTES } from '@/shared/constants';
import { Link } from '@/shared/i18n/navigation';
import { BrandMark } from '@/ui-kit';

import s from './AccountNav.module.scss';

export const AccountNav = () => {
  const t = useTranslations('nav');

  return (
    <header className={s.root}>
      <Link aria-label={t('home')} className={s.brand} href={ROUTES.landing}>
        <BrandMark labelClassName={s.brandLabel} size='lg' />
      </Link>

      <LocaleSwitcher />
    </header>
  );
};
