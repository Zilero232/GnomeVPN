'use client';

import { motion } from 'motion/react';
import { useState } from 'react';

import type { AccountTabsProps } from './AccountTabs.types';

import { PILL_MOTION, TAB_PANEL_MOTION } from '../../AccountPage.motion';

import s from './AccountTabs.module.scss';

export const AccountTabs = ({ items, panelClassName }: AccountTabsProps) => {
  const [active, setActive] = useState(items[0]?.value ?? '');

  const current = items.find((item) => item.value === active) ?? items[0];

  return (
    <div className={s.root}>
      <nav aria-label={current?.label} className={s.nav}>
        {items.map(({ value, label, icon: Icon }) => {
          const isActive = value === active;

          return (
            <button
              key={value}
              aria-current={isActive ? 'page' : undefined}
              className={s.tab}
              data-active={isActive}
              type='button'
              onClick={() => setActive(value)}
            >
              {isActive && <motion.span aria-hidden className={s.pill} layoutId='account-tab-pill' transition={PILL_MOTION} />}

              <span className={s.label}>
                <Icon aria-hidden size={16} />
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      <motion.section
        key={current?.value}
        animate='visible'
        className={current?.isBare ? undefined : panelClassName}
        initial='hidden'
        variants={TAB_PANEL_MOTION}
      >
        {current?.render()}
      </motion.section>
    </div>
  );
};
