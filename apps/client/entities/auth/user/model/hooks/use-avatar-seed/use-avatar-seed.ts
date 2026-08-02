'use client';

import { useSyncExternalStore } from 'react';

import type { UseAvatarSeedInput } from './use-avatar-seed.types';

const sessionSeed = crypto.randomUUID();

const subscribe = () => () => undefined;

export const useAvatarSeed = ({ fallback }: UseAvatarSeedInput) =>
  useSyncExternalStore(
    subscribe,
    () => sessionSeed,
    () => fallback
  );
