import type { ReactNode } from 'react';

import { useTranslations } from 'next-intl';

import { LocaleSwitcher } from '@/features/app/switch-locale';
import { ROUTES } from '@/shared/constants';
import { Link } from '@/shared/i18n/navigation';
import { BrandMark } from '@/ui-kit';

import s from './layout.module.scss';

const AuthLayout = ({ children }: { children: ReactNode }) => {
  const t = useTranslations('nav');

  return (
    <div className={s.root}>
      <header className={s.header}>
        <Link aria-label={t('home')} className={s.brand} href={ROUTES.landing}>
          <BrandMark />
        </Link>

        <LocaleSwitcher />
      </header>

      <main className={s.main}>
        <div className={s.panel}>{children}</div>
      </main>
    </div>
  );
};

export default AuthLayout;
