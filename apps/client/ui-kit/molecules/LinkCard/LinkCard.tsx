import { ExternalLink } from 'lucide-react';

import type { LinkCardProps } from './LinkCard.types';

import { Text } from '../../atoms';
import { linkCard } from './LinkCard.variants';

import s from './LinkCard.module.scss';

export const LinkCard = ({ label, hint, icon: Icon, size, className, ...props }: LinkCardProps) => (
  <a className={linkCard({ size, class: className })} rel='noopener noreferrer' target='_blank' {...props}>
    {Icon && <Icon aria-hidden className={s.icon} size={20} />}

    <span className={s.body}>
      <Text as='span' className={s.label} size='sm'>
        {label}
      </Text>

      {hint && (
        <Text as='span' size='xs' tone='muted'>
          {hint}
        </Text>
      )}
    </span>

    <ExternalLink aria-hidden className={s.external} size={14} />
  </a>
);
