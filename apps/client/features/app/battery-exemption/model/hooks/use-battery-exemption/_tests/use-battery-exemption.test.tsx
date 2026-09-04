import { render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const isBatteryUnrestricted = vi.fn();
const requestBatteryUnrestricted = vi.fn();
const isTauriMobile = vi.fn();

vi.mock('@/shared/lib', () => ({
  isBatteryUnrestricted,
  requestBatteryUnrestricted,
  isTauriMobile,
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() }
}));

const { useBatteryExemption } = await import('../use-battery-exemption');

let seen: ReturnType<typeof useBatteryExemption>;

const Probe = () => {
  seen = useBatteryExemption();

  return null;
};

beforeEach(() => {
  isTauriMobile.mockReturnValue(true);
  isBatteryUnrestricted.mockReset().mockResolvedValue(false);
  requestBatteryUnrestricted.mockReset().mockResolvedValue(false);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useBatteryExemption', () => {
  it('assumes the exemption is in place until the check says otherwise', () => {
    isBatteryUnrestricted.mockReturnValue(new Promise(() => undefined));

    render(<Probe />);

    expect(seen.isGranted).toBe(true);
  });

  it('reports a restricted app once the check answers', async () => {
    render(<Probe />);

    await waitFor(() => expect(seen.isGranted).toBe(false));
  });

  it('reports an unrestricted app once the check answers', async () => {
    isBatteryUnrestricted.mockResolvedValue(true);

    render(<Probe />);

    await waitFor(() => expect(isBatteryUnrestricted).toHaveBeenCalled());

    expect(seen.isGranted).toBe(true);
  });

  it('never asks Android anything in the browser', () => {
    isTauriMobile.mockReturnValue(false);

    render(<Probe />);

    expect(isBatteryUnrestricted).not.toHaveBeenCalled();
    expect(seen.isGranted).toBe(true);
  });

  it('re-checks when the window regains focus, since leaving for Settings is the only signal back', async () => {
    render(<Probe />);

    await waitFor(() => expect(isBatteryUnrestricted).toHaveBeenCalledTimes(1));

    isBatteryUnrestricted.mockResolvedValue(true);
    window.dispatchEvent(new Event('focus'));

    await waitFor(() => expect(seen.isGranted).toBe(true));
  });

  it('re-checks when the tab becomes visible again', async () => {
    render(<Probe />);

    await waitFor(() => expect(isBatteryUnrestricted).toHaveBeenCalledTimes(1));

    document.dispatchEvent(new Event('visibilitychange'));

    await waitFor(() => expect(isBatteryUnrestricted).toHaveBeenCalledTimes(2));
  });

  it('stops listening once unmounted', async () => {
    const view = render(<Probe />);

    await waitFor(() => expect(isBatteryUnrestricted).toHaveBeenCalledTimes(1));

    view.unmount();
    window.dispatchEvent(new Event('focus'));

    expect(isBatteryUnrestricted).toHaveBeenCalledTimes(1);
  });

  it('opens the settings screen and keeps the banner up, because the answer only arrives on the way back', async () => {
    render(<Probe />);

    await waitFor(() => expect(seen.isGranted).toBe(false));

    await seen.request();

    expect(requestBatteryUnrestricted).toHaveBeenCalled();
    expect(seen.isGranted).toBe(false);
  });

  it('survives a failing check without crashing the screen', async () => {
    isBatteryUnrestricted.mockRejectedValue(new Error('no plugin'));

    render(<Probe />);

    await waitFor(() => expect(isBatteryUnrestricted).toHaveBeenCalled());

    expect(seen.isGranted).toBe(true);
  });

  it('survives a failing request', async () => {
    requestBatteryUnrestricted.mockRejectedValue(new Error('no activity'));

    render(<Probe />);

    await waitFor(() => expect(seen.isGranted).toBe(false));

    await expect(seen.request()).resolves.toBeUndefined();
    expect(seen.isRequesting).toBe(false);
  });
});
