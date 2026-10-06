'use client';

import { clsx } from 'clsx';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { LocaleSwitcher } from '@/features/app/switch-locale';
import { ROUTES, SITE_NAV } from '@/shared/constants';
import { Link, usePathname } from '@/shared/i18n/navigation';
import { BrandMark, buttonVariants } from '@/ui-kit';

import { SiteNavMenu } from './components';
import { CONTENT_ID } from './SiteHeader.constants';

import s from './SiteHeader.module.scss';

export const SiteHeader = () => {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
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
      <a className={s.skip} href={`#${CONTENT_ID}`}>
        {tCommon('skipToContent')}
      </a>

      <div aria-hidden ref={sentinelRef} className={s.sentinel} />

      <header className={clsx(s.root, isScrolled && s.scrolled)}>
        <div className={s.inner}>
          <Link aria-label={t('home')} className={s.brand} href={ROUTES.landing}>
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

            <Link className={buttonVariants({ class: s.accountLink })} href={ROUTES.account}>
              {t('account')}
            </Link>

            <SiteNavMenu />
          </div>
        </div>
      </header>
    </>
  );
};
