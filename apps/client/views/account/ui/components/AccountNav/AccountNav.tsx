'use client';

import { LocaleSwitcher } from '@/features/app/switch-locale';
import { ROUTES } from '@/shared/constants';
import { Link } from '@/shared/i18n/navigation';
import { BrandMark } from '@/ui-kit';

import s from './AccountNav.module.scss';

export const AccountNav = () => (
  <nav className={s.root}>
    <Link className={s.brand} href={ROUTES.landing}>
      <BrandMark labelClassName={s.brandLabel} size='lg' />
    </Link>

    <LocaleSwitcher />
  </nav>
);
