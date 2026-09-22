'use client';

import { useQuery } from '@tanstack/react-query';

import { authClient } from '@/shared/api';
import { QUERY_KEYS } from '@/shared/constants';
import { useHydrated } from '@/shared/lib';

import type { AccountIdentity } from './use-account-identity.types';

import { avatarSeed } from '../../../lib';
import { useCurrentUser } from '../use-current-user';
import { CREDENTIAL_PROVIDER } from './use-account-identity.constants';

export const useAccountIdentity = (): AccountIdentity => {
  const { user, email, hasRealEmail } = useCurrentUser();
  const isHydrated = useHydrated();

  const { data: accounts } = useQuery({
    queryKey: QUERY_KEYS.authAccounts(),
    queryFn: async () => (await authClient.listAccounts()).data ?? []
  });

  if (!isHydrated) {
    return { email: '', hasEmail: true, hasPassword: true, avatarSeed: avatarSeed('') };
  }

  return {
    email,
    hasEmail: hasRealEmail,
    hasPassword: (accounts ?? []).some((account) => account.providerId === CREDENTIAL_PROVIDER),
    avatarSeed: avatarSeed(user?.id ?? '')
  };
};
