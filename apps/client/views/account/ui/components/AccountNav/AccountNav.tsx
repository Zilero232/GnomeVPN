'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { usePlatform } from '@/entities/app/platform';
import { LocaleSwitcher } from '@/features/app/switch-locale';
import { ROUTES } from '@/shared/constants';
import { BrandMark } from '@/shared/ui';

import s from './AccountNav.module.scss';

export const AccountNav = () => {
  const t = useTranslations('account');
  const { isDesktopApp } = usePlatform();

  return (
    <nav className={s.root}>
      {isDesktopApp ? (
        <Link className={s.back} href={ROUTES.app}>
          <ArrowLeft size={15} />
          {t('backToVpn')}
        </Link>
      ) : (
        <Link className={s.brand} href={ROUTES.landing}>
          <BrandMark labelClassName={s.brandLabel} size="lg" />
        </Link>
      )}

      <LocaleSwitcher />
    </nav>
  );
};
