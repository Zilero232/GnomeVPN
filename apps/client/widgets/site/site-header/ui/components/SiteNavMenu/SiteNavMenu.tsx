'use client';

import { Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { ROUTES } from '@/shared/constants';
import { Link, usePathname } from '@/shared/i18n/navigation';
import { Button, Dialog, DialogContent, DialogTitle } from '@/ui-kit';

import { SITE_NAV } from '../../../config';

import s from './SiteNavMenu.module.scss';

export const SiteNavMenu = () => {
  const t = useTranslations('nav');
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <button aria-label={t('openMenu')} className={s.trigger} type='button' onClick={() => setIsOpen(true)}>
        <Menu size={18} />
      </button>

      <DialogContent className={s.content}>
        <DialogTitle className={s.title}>{t('menu')}</DialogTitle>

        <nav aria-label={t('ariaLabel')} className={s.nav}>
          {SITE_NAV.map(({ key, href }) => (
            <Link key={key} aria-current={pathname === href ? 'page' : undefined} className={s.link} href={href} onClick={() => setIsOpen(false)}>
              {t(key)}
            </Link>
          ))}
        </nav>

        <Link className={s.account} href={ROUTES.account} onClick={() => setIsOpen(false)}>
          <Button>{t('account')}</Button>
        </Link>
      </DialogContent>
    </Dialog>
  );
};
