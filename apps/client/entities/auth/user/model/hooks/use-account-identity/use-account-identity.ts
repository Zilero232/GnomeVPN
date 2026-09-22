'use client';

import { useHydrated } from '@/shared/lib';

import type { AccountIdentity } from './use-account-identity.types';

import { avatarSeed } from '../../../lib';
import { useCurrentUser } from '../use-current-user';

export const useAccountIdentity = (): AccountIdentity => {
  const { user, email, hasRealEmail } = useCurrentUser();
  const isHydrated = useHydrated();

  if (!isHydrated) {
    return { email: '', hasEmail: true, avatarSeed: avatarSeed('') };
  }

  return { email, hasEmail: hasRealEmail, avatarSeed: avatarSeed(user?.id ?? '') };
};
