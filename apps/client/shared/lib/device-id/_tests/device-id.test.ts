import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const setting = { get: vi.fn(), set: vi.fn() };

vi.mock('../../app-settings', () => ({ deviceIdSetting: setting }));

const freshGetDeviceId = async () => {
  vi.resetModules();

  const module = await import('../device-id');

  return module.getDeviceId;
};

beforeEach(() => {
  window.localStorage.clear();

  setting.get.mockReset().mockResolvedValue(null);
  setting.set.mockReset().mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getDeviceId', () => {
  it('returns the id already stored in settings without touching local storage', async () => {
    setting.get.mockResolvedValue('stored-id');

    const getDeviceId = await freshGetDeviceId();

    await expect(getDeviceId()).resolves.toBe('stored-id');

    expect(setting.set).not.toHaveBeenCalled();
    expect(window.localStorage.getItem('gnomevpn.device-id')).toBeNull();
  });

  it('creates an id and persists it to both stores on the first call', async () => {
    const getDeviceId = await freshGetDeviceId();
    const id = await getDeviceId();

    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(setting.set).toHaveBeenCalledWith(id);
    expect(window.localStorage.getItem('gnomevpn.device-id')).toBe(id);
  });

  it('reuses the id left in local storage rather than minting a new one', async () => {
    window.localStorage.setItem('gnomevpn.device-id', 'browser-id');

    const getDeviceId = await freshGetDeviceId();

    await expect(getDeviceId()).resolves.toBe('browser-id');

    expect(setting.set).toHaveBeenCalledWith('browser-id');
  });

  it('resolves concurrent callers to the same id and reads the setting once', async () => {
    const getDeviceId = await freshGetDeviceId();

    const [first, second, third] = await Promise.all([getDeviceId(), getDeviceId(), getDeviceId()]);

    expect(second).toBe(first);
    expect(third).toBe(first);
    expect(setting.get).toHaveBeenCalledTimes(1);
  });

  it('keeps returning the same id across later calls', async () => {
    const getDeviceId = await freshGetDeviceId();
    const first = await getDeviceId();

    setting.get.mockResolvedValue(first);

    await expect(getDeviceId()).resolves.toBe(first);
  });

  it('retries after a failed resolution instead of caching the rejection', async () => {
    setting.get.mockRejectedValueOnce(new Error('store unavailable'));

    const getDeviceId = await freshGetDeviceId();

    await expect(getDeviceId()).rejects.toThrow('store unavailable');

    await expect(getDeviceId()).resolves.toMatch(/^[0-9a-f-]{36}$/);
  });
});
