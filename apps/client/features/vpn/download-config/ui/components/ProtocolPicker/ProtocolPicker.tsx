'use client';

import { Check, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import type { ProtocolControlProps } from '@/entities/vpn/protocol';

import { PROTOCOL_OPTIONS } from '@/entities/vpn/protocol';
import { Badge, Text } from '@/shared/ui';

import { CARD_MOTION, PROTOCOL_ICON } from '../../../config';

import s from './ProtocolPicker.module.scss';

export const ProtocolPicker = ({ value, isDisabled, onChange }: ProtocolControlProps) => {
  const t = useTranslations('configs');

  return (
    <div className={s.list} role='radiogroup'>
      {PROTOCOL_OPTIONS.map(({ protocol, icon, isRecommended, tagKey, descKey, noteKey, noteHintKey, traits }) => {
        const isSelected = value === protocol;
        const Icon = PROTOCOL_ICON[icon];

        return (
          <button
            key={protocol}
            aria-checked={isSelected}
            className={s.card}
            data-selected={isSelected}
            disabled={isDisabled}
            role='radio'
            type='button'
            onClick={() => onChange(protocol)}
          >
            {isSelected && <motion.span aria-hidden className={s.glow} layoutId='protocol-glow' transition={CARD_MOTION} />}

            <span className={s.inner}>
              <span className={s.head}>
                <span className={s.icon}>
                  <Icon aria-hidden size={16} />
                </span>

                <Text as='span' className={s.name}>
                  {t(`protocol.${protocol}`)}
                </Text>

                {isRecommended && tagKey && <Badge>{t(tagKey)}</Badge>}

                <span className={s.check}>{isSelected && <Check aria-hidden size={14} />}</span>
              </span>

              <Text className={s.desc} size='xs' tone='muted'>
                {t(descKey)}
              </Text>

              {noteKey && (
                <span className={s.note} title={noteHintKey ? t(noteHintKey) : undefined}>
                  <Info aria-hidden className={s.noteIcon} size={12} />

                  <Text as='span' size='xs'>
                    {t(noteKey)}
                  </Text>
                </span>
              )}

              <span className={s.traits}>
                {traits.map((trait) => (
                  <span key={trait.key} className={s.trait}>
                    <Text as='span' className={s.traitName}>
                      {t(trait.key)}
                    </Text>

                    <span aria-hidden className={s.meter} data-grade={trait.grade}>
                      <span className={s.fill} />
                    </span>
                  </span>
                ))}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
};
