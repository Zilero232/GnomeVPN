import { beforeEach, describe, expect, it } from 'vitest';

import { isCheckoutPending, markCheckoutPending } from '../pending-checkout';
import { PENDING_CHECKOUT } from '../pending-checkout.constants';

const now = 1_800_000_000_000;

describe('pending checkout', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('is not pending before anyone went to pay', () => {
    expect(isCheckoutPending(now)).toBe(false);
  });

  it('is pending right after the reader left for the payment page', () => {
    markCheckoutPending(now);

    expect(isCheckoutPending(now + 1_000)).toBe(true);
  });

  it('stops being pending once the window has passed, so an abandoned payment does not poll forever', () => {
    markCheckoutPending(now);

    expect(isCheckoutPending(now + PENDING_CHECKOUT.windowMs)).toBe(false);
  });
});
