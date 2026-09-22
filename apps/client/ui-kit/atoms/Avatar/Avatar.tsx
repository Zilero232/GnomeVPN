'use client';

import { botttsNeutral } from '@dicebear/collection';
import { createAvatar } from '@dicebear/core';
import { clsx } from 'clsx';

import { AVATAR } from '@/shared/config';

import type { AvatarProps } from './Avatar.types';

import s from './Avatar.module.scss';

export const Avatar = ({ seed, size = AVATAR.size, className, ...props }: AvatarProps) => {
  const source = createAvatar(botttsNeutral, {
    seed,
    size,
    radius: AVATAR.radius,
    backgroundColor: [...AVATAR.backgrounds]
  }).toDataUri();

  return (
    <span aria-hidden className={clsx(s.root, className)} style={{ width: size, height: size }} {...props}>
      <img alt='' className={s.image} height={size} src={source} width={size} />
    </span>
  );
};
