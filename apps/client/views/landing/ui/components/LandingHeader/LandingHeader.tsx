'use client';

import { clsx } from 'clsx';
import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { DownloadAppDialog } from '@/features/app/download-app';
import { LocaleSwitcher } from '@/features/app/switch-locale';
import { DOWNLOAD_HASH, ROUTES } from '@/shared/constants';
import { BrandMark, Button } from '@/shared/ui';

import { LANDING_NAV_SECTIONS } from '../../../config';

import s from './LandingHeader.module.scss';

export const LandingHeader = () => {
  const t = useTranslations('landing');

  const sentinelRef = useRef<HTMLDivElement>(null);

  const [isScrolled, setIsScrolled] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);

  useEffect(() => {
    if (window.location.hash === DOWNLOAD_HASH) {
      setIsDownloadOpen(true);
    }
  }, []);

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

          <nav aria-label={t('nav.ariaLabel')} className={s.nav}>
            {LANDING_NAV_SECTIONS.map((section) => (
              <a key={section} className={s.navLink} href={`#${section}`}>
                {t(`nav.${section}`)}
              </a>
            ))}
          </nav>

          <div className={s.actions}>
            <LocaleSwitcher />

            <Button
              aria-label={t('nav.download')}
              variant='ghost'
              onClick={() => setIsDownloadOpen(true)}
            >
              <Download size={14} />
              <span className={s.downloadLabel}>{t('nav.download')}</span>
            </Button>

            <Link href={ROUTES.account}>
              <Button>{t('account')}</Button>
            </Link>
          </div>
        </div>
      </header>

      <DownloadAppDialog isOpen={isDownloadOpen} onOpenChange={setIsDownloadOpen} />
    </>
  );
};
