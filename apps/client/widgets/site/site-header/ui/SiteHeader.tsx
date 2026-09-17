'use client';

import { clsx } from 'clsx';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { LocaleSwitcher } from '@/features/app/switch-locale';
import { ROUTES, SITE_NAV } from '@/shared/constants';
import { Link, usePathname } from '@/shared/i18n/navigation';
import { BrandMark, Button } from '@/ui-kit';

import { SiteNavMenu } from './components';

import s from './SiteHeader.module.scss';

export const SiteHeader = () => {
  const t = useTranslations('nav');
  const pathname = usePathname();

  const sentinelRef = useRef<HTMLDivElement>(null);

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => setIsScrolled(!entry.isIntersecting));

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div aria-hidden ref={sentinelRef} className={s.sentinel} />

      <header className={clsx(s.root, isScrolled && s.scrolled)}>
        <div className={s.inner}>
          <Link className={s.brand} href={ROUTES.landing}>
            <BrandMark labelClassName={s.brandLabel} size='lg' />
          </Link>

          <nav aria-label={t('ariaLabel')} className={s.nav}>
            {SITE_NAV.map(({ key, href }) => (
              <Link key={key} aria-current={pathname === href ? 'page' : undefined} className={s.navLink} href={href}>
                {t(key)}
              </Link>
            ))}
          </nav>

          <div className={s.actions}>
            <LocaleSwitcher />

            <Link className={s.accountLink} href={ROUTES.account}>
              <Button>{t('account')}</Button>
            </Link>

            <SiteNavMenu />
          </div>
        </div>
      </header>
    </>
  );
};
