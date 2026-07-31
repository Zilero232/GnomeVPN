'use client';

import { SPLIT_MODE } from '@gnomevpn/schemas';
import { ArrowRight, ShieldOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { match } from 'ts-pattern';

import { Text } from '@/shared/ui';

import type { SplitModeToggleProps } from './SplitModeToggle.types';

import s from './SplitModeToggle.module.scss';

export const SplitModeToggle = ({ label, lead, mode, onModeChange, aside }: SplitModeToggleProps) => {
  const t = useTranslations('splitTunneling');

  const isAllowed = mode === SPLIT_MODE.allowed;

  const toggle = () => onModeChange(isAllowed ? SPLIT_MODE.disallowed : SPLIT_MODE.allowed);

  const hint = match(mode)
    .with(SPLIT_MODE.allowed, () => t('modeAllowedHint'))
    .otherwise(() => t('modeDisallowedHint'));

  return (
    <div className={s.mode}>
      <div className={s.row}>
        <Text as='span' className={s.lead} size='sm'>
          {lead}
        </Text>

        <button aria-label={label} className={s.pill} data-mode={mode} type='button' onClick={toggle}>
          {isAllowed ? <ArrowRight aria-hidden size={13} /> : <ShieldOff aria-hidden size={13} />}
          {isAllowed ? t('modeAllowed') : t('modeDisallowed')}
        </button>

        {aside && <div className={s.aside}>{aside}</div>}
      </div>

      <Text as='p' className={s.hint} size='xs' tone='muted'>
        {hint}
      </Text>
    </div>
  );
};
