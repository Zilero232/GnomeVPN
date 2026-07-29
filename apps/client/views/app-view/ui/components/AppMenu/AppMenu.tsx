'use client';

import { useClickOutside } from '@siberiacancode/reactuse';
import { LogOut, Settings, ShieldCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { usePlatform } from '@/entities/app/platform';
import { CheckUpdateButton } from '@/features/app/check-update';
import { useStartupSettings } from '@/features/app/startup-settings';
import { LocaleSwitcher } from '@/features/app/switch-locale';
import { useCloseToTray } from '@/features/app/system-tray';
import { useSignOut } from '@/features/auth/sign-out';
import { openSystemVpnSettings } from '@/shared/lib';
import { Switch } from '@/shared/ui';

import { MENU_ITEM_MOTION, MENU_MOTION } from './AppMenu.motion';
import { MenuItem } from './components';

import s from './AppMenu.module.scss';

export const AppMenu = () => {
  const t = useTranslations('app');
  const tray = useTranslations('tray');

  const { isDesktopApp, isMobileApp } = usePlatform();
  const { closeToTray, setCloseToTray } = useCloseToTray();
  const {
    autoStart,
    autoConnect,
    autoReconnect,
    toggleAutoStart,
    toggleAutoConnect,
    toggleAutoReconnect
  } = useStartupSettings();

  const [isOpen, setIsOpen] = useState(false);

  const ref = useClickOutside<HTMLDivElement>(() => setIsOpen(false));

  const signOut = useSignOut();

  return (
    <div ref={ref} className={s.root}>
      <motion.button
        animate={{ rotate: isOpen ? 45 : 0 }}
        aria-expanded={isOpen}
        aria-label={t('menu')}
        className={s.trigger}
        transition={{ type: 'spring', stiffness: 420, damping: 22 }}
        type='button'
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Settings size={15} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div className={s.menu} {...MENU_MOTION}>
            {isDesktopApp && (
              <>
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

                <MenuItem
                  isPressed={autoStart}
                  label={tray('autoStart')}
                  trailing={<Switch isChecked={autoStart} />}
                  onClick={() => toggleAutoStart(!autoStart)}
                />
              </>
            )}

            <MenuItem
              isPressed={autoConnect}
              label={tray('autoConnect')}
              trailing={<Switch isChecked={autoConnect} />}
              onClick={() => toggleAutoConnect(!autoConnect)}
            />

            <MenuItem
              isPressed={autoReconnect}
              label={tray('autoReconnect')}
              trailing={<Switch isChecked={autoReconnect} />}
              onClick={() => toggleAutoReconnect(!autoReconnect)}
            />

            {isMobileApp && (
              <MenuItem
                icon={ShieldCheck}
                label={tray('alwaysOnVpn')}
                onClick={() => void openSystemVpnSettings()}
              />
            )}

            <motion.div className={s.section} variants={MENU_ITEM_MOTION}>
              <span className={s.sectionLabel}>{tray('language')}</span>
              <LocaleSwitcher />
            </motion.div>

            <div className={s.divider} />

            <MenuItem
              icon={LogOut}
              label={t('signOut')}
              tone='danger'
              onClick={() => signOut.mutate()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
