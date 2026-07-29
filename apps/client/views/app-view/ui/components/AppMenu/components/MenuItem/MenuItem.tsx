'use client';

import { clsx } from 'clsx';
import { motion } from 'motion/react';

import type { MenuItemProps } from './MenuItem.types';

import { MENU_ITEM_MOTION } from '../../AppMenu.motion';

import s from './MenuItem.module.scss';

export const MenuItem = ({
  label,
  icon: Icon,
  trailing,
  tone = 'default',
  isPressed,
  onClick
}: MenuItemProps) => (
  <motion.button
    aria-pressed={isPressed}
    className={clsx(s.root, tone === 'danger' && s.danger)}
    type='button'
    variants={MENU_ITEM_MOTION}
    onClick={onClick}
  >
    {Icon && (
      <span className={s.icon}>
        <Icon size={14} />
      </span>
    )}

    <span className={s.label}>{label}</span>
    {trailing}
  </motion.button>
);
