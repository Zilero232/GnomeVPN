'use client';

import { useClickOutside } from '@siberiacancode/reactuse';
import { LogOut, Settings, UserRound } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { CheckUpdateButton } from '@/features/app/check-update';
import { LocaleSwitcher } from '@/features/app/switch-locale';
import { useCloseToTray } from '@/features/app/system-tray';
import { authClient, clearToken } from '@/shared/api';
import { ROUTES } from '@/shared/constants';
import { Switch } from '@/shared/ui';
import { MENU_ITEM_MOTION, MENU_MOTION } from './AppMenu.motion';
import { MenuItem } from './components';

import s from './AppMenu.module.scss';

export const AppMenu = () => {
  const t = useTranslations('app');
  const tray = useTranslations('tray');
  const router = useRouter();

  const { closeToTray, setCloseToTray } = useCloseToTray();

  const [isOpen, setIsOpen] = useState(false);

  const ref = useClickOutside<HTMLDivElement>(() => setIsOpen(false));

  const onSignOut = async () => {
    await authClient.signOut();
    clearToken();
  };

  return (
    <div className={s.root} ref={ref}>
      <motion.button
        animate={{ rotate: isOpen ? 45 : 0 }}
        aria-expanded={isOpen}
        className={s.trigger}
        transition={{ type: 'spring', stiffness: 420, damping: 22 }}
        type="button"
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Settings size={15} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div className={s.menu} {...MENU_MOTION}>
            <MenuItem
              icon={UserRound}
              label={t('openAccount')}
              onClick={() => router.push(ROUTES.account)}
            />

            <motion.div variants={MENU_ITEM_MOTION}>
              <CheckUpdateButton />
            </motion.div>

            <div className={s.divider} />

            <MenuItem
              isPressed={closeToTray}
              label={tray('closeToTray')}
              trailing={<Switch isChecked={closeToTray} />}
              onClick={() => setCloseToTray(!closeToTray)}
            />

            <motion.div className={s.section} variants={MENU_ITEM_MOTION}>
              <span className={s.sectionLabel}>{tray('language')}</span>
              <LocaleSwitcher />
            </motion.div>

            <div className={s.divider} />

            <MenuItem icon={LogOut} label={t('signOut')} tone="danger" onClick={onSignOut} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
