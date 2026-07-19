import { clsx } from 'clsx';

import { SITE } from '@/shared/config';

import s from './BrandMark.module.scss';

import type { BrandMarkProps } from './BrandMark.types';

const DOT_SIZE = { sm: s.dotSm, md: undefined, lg: s.dotLg } as const;

export const BrandMark = ({ size = 'md', tone = 'default', className }: BrandMarkProps) => (
  <span className={clsx(s.root, s[size], tone === 'muted' && s.muted, className)}>
    <span className={clsx(s.dot, DOT_SIZE[size])} />
    {SITE.name}
  </span>
);
