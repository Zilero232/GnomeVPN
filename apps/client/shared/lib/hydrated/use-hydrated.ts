'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => undefined;

const onClient = () => true;

const onServer = () => false;

export const useHydrated = (): boolean => useSyncExternalStore(subscribe, onClient, onServer);
