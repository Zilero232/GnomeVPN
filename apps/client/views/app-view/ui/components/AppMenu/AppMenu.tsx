'use client';

import { useClickOutside } from '@siberiacancode/reactuse';
import { ChevronRight, LogOut, Settings } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';

import { usePlatform } from '@/entities/app/platform';
import { useAvatarSeed, useCurrentUser } from '@/entities/auth/user';
import { CheckUpdateButton } from '@/features/app/check-update';
import { useStartupSettings } from '@/features/app/startup-settings';
import { LocaleSwitcher } from '@/features/app/switch-locale';
import { useCloseToTray } from '@/features/app/system-tray';
import { useSignOut } from '@/features/auth/sign-out';
import { AVATAR_SIZE_SM } from '@/shared/config';
import { ROUTES } from '@/shared/constants';
import { Avatar, Switch, Text } from '@/shared/ui';

import { MENU_ITEM_MOTION, MENU_MOTION } from '../../../config';
import { MenuItem } from './components';

import s from './AppMenu.module.scss';

export const AppMenu = () => {
  const t = useTranslations('app');
  const tray = useTranslations('tray');

  const { isDesktopApp } = usePlatform();
  const { email, name } = useCurrentUser();
  const avatarSeed = useAvatarSeed({ fallback: email });
  const { closeToTray, setCloseToTray } = useCloseToTray();
  const { autoStart, autoConnect, autoReconnect, toggleAutoStart, toggleAutoConnect, toggleAutoReconnect } = useStartupSettings();

  const [isOpen, setIsOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setIsOpen(false));
  const signOut = useSignOut();

  const toggles = [
    { key: 'closeToTray', isOn: closeToTray, onToggle: setCloseToTray },
    { key: 'autoStart', isOn: autoStart, onToggle: toggleAutoStart },
    { key: 'autoConnect', isOn: autoConnect, onToggle: toggleAutoConnect },
    { key: 'autoReconnect', isOn: autoReconnect, onToggle: toggleAutoReconnect }
  ] as const;

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
            <motion.div variants={MENU_ITEM_MOTION}>
              <Link className={s.account} href={ROUTES.account} onClick={() => setIsOpen(false)}>
                <Avatar seed={avatarSeed} size={AVATAR_SIZE_SM} />

                <span className={s.accountText}>
                  <Text as='span' className={s.accountTitle}>
                    {name || t('openAccount')}
                  </Text>

                  <Text as='span' className={s.accountMail}>
                    {email}
                  </Text>
                </span>

                <ChevronRight aria-hidden className={s.accountArrow} size={15} />
              </Link>
            </motion.div>

            <div className={s.divider} />

            {isDesktopApp && (
              <>
                <motion.div variants={MENU_ITEM_MOTION}>
                  <CheckUpdateButton />
                </motion.div>

                <div className={s.divider} />

                {toggles.map(({ key, isOn, onToggle }) => (
                  <MenuItem key={key} isPressed={isOn} label={tray(key)} trailing={<Switch isChecked={isOn} />} onClick={() => onToggle(!isOn)} />
                ))}
              </>
            )}

            <motion.div className={s.section} variants={MENU_ITEM_MOTION}>
              <span className={s.sectionLabel}>{tray('language')}</span>
              <LocaleSwitcher />
            </motion.div>

            <div className={s.divider} />

            <MenuItem icon={LogOut} label={t('signOut')} tone='danger' onClick={() => signOut.mutate()} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
