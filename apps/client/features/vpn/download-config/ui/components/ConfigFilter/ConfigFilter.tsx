'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { CountryFlag, Text } from '@/shared/ui';

import type { ConfigFilterProps } from './ConfigFilter.types';

import { CHIP_MOTION, CONFIG_FILTER_ALL, CONFIG_FILTER_ONLINE } from '../../../config';

import s from './ConfigFilter.module.scss';

export const ConfigFilter = ({ value, countries, total, onlineCount, isDisabled, className, onChange }: ConfigFilterProps) => {
  const t = useTranslations('configs');

  const chips = [
    { id: CONFIG_FILTER_ALL, label: t('filterAll'), count: total, countryCode: null },
    ...(onlineCount > 0 ? [{ id: CONFIG_FILTER_ONLINE, label: t('filterOnline'), count: onlineCount, countryCode: null }] : []),
    ...countries.map((country) => ({ id: country.name, label: country.name, count: country.count, countryCode: country.code }))
  ];

  return (
    <div aria-label={t('filterLabel')} className={[s.root, className].filter(Boolean).join(' ')} role='group'>
      {chips.map((chip) => {
        const isActive = chip.id === value;

        return (
          <button
            key={chip.id}
            aria-pressed={isActive}
            className={s.chip}
            data-active={isActive}
            data-online={chip.id === CONFIG_FILTER_ONLINE}
            disabled={isDisabled}
            type='button'
            onClick={() => onChange(chip.id)}
          >
            {isActive && <motion.span className={s.pill} layoutId='config-filter-pill' transition={CHIP_MOTION} />}

            <span className={s.content}>
              {chip.countryCode && <CountryFlag countryCode={chip.countryCode} />}

              {chip.id === CONFIG_FILTER_ONLINE && <span aria-hidden className={s.dot} />}

              <Text as='span' className={s.label}>
                {chip.label}
              </Text>

              <Text as='span' className={s.count}>
                {chip.count}
              </Text>
            </span>
          </button>
        );
      })}
    </div>
  );
};
