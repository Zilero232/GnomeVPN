'use client';

import type { TunnelProtocol } from '@gnomevpn/schemas';

import { useClickOutside } from '@siberiacancode/reactuse';
import { clsx } from 'clsx';
import { Check, ChevronDown, ShieldCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import type { ProtocolControlProps } from '@/entities/vpn/protocol';

import { PROTOCOLS } from '@/entities/vpn/protocol';

import { MENU_ITEM_MOTION, MENU_MOTION } from './ProtocolSwitch.motion';

import s from './ProtocolSwitch.module.scss';

export const ProtocolSwitch = ({ value, isDisabled, onChange }: ProtocolControlProps) => {
  const t = useTranslations('configs');

  const [isOpen, setIsOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setIsOpen(false));

  const pick = (protocol: TunnelProtocol) => {
    onChange(protocol);
    setIsOpen(false);
  };

  return (
    <div ref={ref} className={s.root}>
      <button
        aria-expanded={isOpen}
        aria-haspopup='listbox'
        className={s.trigger}
        disabled={isDisabled}
        type='button'
        onClick={() => setIsOpen((open) => !open)}
      >
        <ShieldCheck className={s.icon} size={13} />
        <span className={s.current}>{t(`protocol.${value}`)}</span>
        <ChevronDown className={clsx(s.chevron, isOpen && s.chevronOpen)} size={13} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul className={s.menu} role='listbox' {...MENU_MOTION}>
            {PROTOCOLS.map((protocol) => (
              <motion.li key={protocol} variants={MENU_ITEM_MOTION}>
                <button
                  aria-selected={value === protocol}
                  className={clsx(s.option, value === protocol && s.active)}
                  role='option'
                  type='button'
                  onClick={() => pick(protocol)}
                >
                  <span>{t(`protocol.${protocol}`)}</span>
                  {value === protocol && <Check size={14} />}
                </button>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};
