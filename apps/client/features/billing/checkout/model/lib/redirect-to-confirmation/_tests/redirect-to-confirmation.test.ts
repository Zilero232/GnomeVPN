import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const isBrowser = vi.fn();

vi.mock('@/shared/lib', () => ({ isBrowser }));

const { redirectToConfirmation } = await import('../redirect-to-confirmation');

const URL_YOOKASSA = 'https://yoomoney.ru/checkout/payments/v2/contract?orderId=42';

let assign: ReturnType<typeof vi.fn>;
let realLocation: Location;

beforeEach(() => {
  assign = vi.fn();
  realLocation = window.location;

  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...realLocation, assign }
  });
});

afterEach(() => {
  Object.defineProperty(window, 'location', { configurable: true, value: realLocation });

  vi.clearAllMocks();
});

describe('redirectToConfirmation', () => {
  it('sends the browser to the confirmation page', () => {
    isBrowser.mockReturnValue(true);

    expect(redirectToConfirmation(URL_YOOKASSA)).toBe(true);
    expect(assign).toHaveBeenCalledWith(URL_YOOKASSA);
  });

  it('reports no redirect when the payment carries no confirmation url', () => {
    isBrowser.mockReturnValue(true);

    expect(redirectToConfirmation(null)).toBe(false);
    expect(assign).not.toHaveBeenCalled();
  });

  it('navigates nothing during prerender, where there is no window to navigate', () => {
    isBrowser.mockReturnValue(false);

    expect(redirectToConfirmation(URL_YOOKASSA)).toBe(false);
    expect(assign).not.toHaveBeenCalled();
  });
});
