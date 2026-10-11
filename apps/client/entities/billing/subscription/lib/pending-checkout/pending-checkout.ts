import { STORAGE_KEYS } from '@/shared/constants';
import { isServer } from '@/shared/lib';

import { PENDING_CHECKOUT } from './pending-checkout.constants';

const readStartedAt = (): number => {
  try {
    return Number(window.sessionStorage.getItem(STORAGE_KEYS.checkoutStartedAt));
  } catch {
    return 0;
  }
};

export const markCheckoutPending = (now = Date.now()): void => {
  if (isServer()) {
    return;
  }

  try {
    window.sessionStorage.setItem(STORAGE_KEYS.checkoutStartedAt, String(now));
  } catch {}
};

export const isCheckoutPending = (now = Date.now()): boolean => {
  if (isServer()) {
    return false;
  }

  const startedAt = readStartedAt();

  return startedAt > 0 && now - startedAt < PENDING_CHECKOUT.windowMs;
};
