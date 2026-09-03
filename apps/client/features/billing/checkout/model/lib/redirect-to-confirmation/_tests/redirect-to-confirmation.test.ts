import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const openExternal = vi.fn();
const isBrowser = vi.fn();
const isTauriDesktop = vi.fn();
const isTauriMobile = vi.fn();

vi.mock('@/shared/lib', () => ({ openExternal, isBrowser, isTauriDesktop, isTauriMobile }));

const { redirectToConfirmation } = await import('../redirect-to-confirmation');

const URL_YOOKASSA = 'https://yoomoney.ru/checkout/payments/v2/contract?orderId=42';

const asWeb = () => {
  isBrowser.mockReturnValue(true);
  isTauriDesktop.mockReturnValue(false);
  isTauriMobile.mockReturnValue(false);
};

const asDesktopApp = () => {
  isBrowser.mockReturnValue(true);
  isTauriDesktop.mockReturnValue(true);
  isTauriMobile.mockReturnValue(false);
};

const asMobileApp = () => {
  isBrowser.mockReturnValue(true);
  isTauriDesktop.mockReturnValue(false);
  isTauriMobile.mockReturnValue(true);
};

const asServer = () => {
  isBrowser.mockReturnValue(false);
  isTauriDesktop.mockReturnValue(false);
  isTauriMobile.mockReturnValue(false);
};

let assign: ReturnType<typeof vi.fn>;
let realLocation: Location;

beforeEach(() => {
  assign = vi.fn();
  realLocation = window.location;

  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: { ...realLocation, assign }
  });

  openExternal.mockReset().mockResolvedValue(undefined);
});

afterEach(() => {
  Object.defineProperty(window, 'location', { configurable: true, writable: true, value: realLocation });

  vi.restoreAllMocks();
});

describe('redirectToConfirmation', () => {
  it('reports nothing to do when the payment carries no confirmation url', async () => {
    asWeb();

    await expect(redirectToConfirmation(null)).resolves.toBe(false);

    expect(assign).not.toHaveBeenCalled();
    expect(openExternal).not.toHaveBeenCalled();
  });

  it('navigates the current tab in a browser, because Safari blocks a popup opened after an await', async () => {
    asWeb();

    await expect(redirectToConfirmation(URL_YOOKASSA)).resolves.toBe(true);

    expect(assign).toHaveBeenCalledWith(URL_YOOKASSA);
    expect(openExternal).not.toHaveBeenCalled();
  });

  it('opens the system browser from the desktop app', async () => {
    asDesktopApp();

    await expect(redirectToConfirmation(URL_YOOKASSA)).resolves.toBe(true);

    expect(openExternal).toHaveBeenCalledWith(URL_YOOKASSA);
    expect(assign).not.toHaveBeenCalled();
  });

  it('opens the system browser from the mobile app', async () => {
    asMobileApp();

    await expect(redirectToConfirmation(URL_YOOKASSA)).resolves.toBe(true);

    expect(openExternal).toHaveBeenCalledWith(URL_YOOKASSA);
    expect(assign).not.toHaveBeenCalled();
  });

  it('leaves the navigation to openExternal when there is no window at all', async () => {
    asServer();

    await expect(redirectToConfirmation(URL_YOOKASSA)).resolves.toBe(true);

    expect(openExternal).toHaveBeenCalledWith(URL_YOOKASSA);
    expect(assign).not.toHaveBeenCalled();
  });

  it('waits for the app bridge before reporting success', async () => {
    asDesktopApp();

    let settle = () => undefined as void;

    openExternal.mockReturnValue(
      new Promise<void>((resolve) => {
        settle = resolve;
      })
    );

    const pending = redirectToConfirmation(URL_YOOKASSA);
    const order: string[] = [];

    void pending.then(() => order.push('resolved'));

    await Promise.resolve();

    expect(order).toEqual([]);

    settle();
    await pending;

    expect(order).toEqual(['resolved']);
  });
});
