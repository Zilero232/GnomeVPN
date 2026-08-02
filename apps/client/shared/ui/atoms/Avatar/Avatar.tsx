'use client';

import { botttsNeutral } from '@dicebear/collection';
import { createAvatar } from '@dicebear/core';
import { clsx } from 'clsx';

import { AVATAR_BACKGROUNDS, AVATAR_RADIUS, AVATAR_SIZE } from '@/shared/config';

import type { AvatarProps } from './Avatar.types';

import s from './Avatar.module.scss';

export const Avatar = ({ seed, size = AVATAR_SIZE, alt = '', className, ...props }: AvatarProps) => {
  const source = createAvatar(botttsNeutral, {
    seed,
    size,
    radius: AVATAR_RADIUS,
    backgroundColor: AVATAR_BACKGROUNDS
  }).toDataUri();

  return (
    <span className={clsx(s.root, className)} style={{ width: size, height: size }} {...props}>
      <img alt={alt} className={s.image} height={size} src={source} width={size} />
    </span>
  );
};
