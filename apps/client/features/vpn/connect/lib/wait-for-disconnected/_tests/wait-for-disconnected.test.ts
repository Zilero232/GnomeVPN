import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { waitForDisconnected } from '../wait-for-disconnected';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('waitForDisconnected', () => {
  it('returns as soon as the tunnel already reports disconnected', async () => {
    const readStatus = vi.fn().mockResolvedValue('disconnected');

    await expect(waitForDisconnected({ readStatus })).resolves.toBe(true);

    expect(readStatus).toHaveBeenCalledTimes(1);
  });

  it('keeps polling while the tunnel is still closing', async () => {
    const readStatus = vi.fn().mockResolvedValueOnce('connected').mockResolvedValueOnce('connecting').mockResolvedValue('disconnected');

    const pending = waitForDisconnected({ readStatus, pollMs: 50 });

    await vi.advanceTimersByTimeAsync(120);

    await expect(pending).resolves.toBe(true);
    expect(readStatus).toHaveBeenCalledTimes(3);
  });

  it('reports failure when the tunnel never closes within the timeout', async () => {
    const readStatus = vi.fn().mockResolvedValue('connected');

    const pending = waitForDisconnected({ readStatus, pollMs: 50, timeoutMs: 200 });

    await vi.advanceTimersByTimeAsync(400);

    await expect(pending).resolves.toBe(false);
  });

  it('stops polling once the deadline has passed', async () => {
    const readStatus = vi.fn().mockResolvedValue('connected');

    const pending = waitForDisconnected({ readStatus, pollMs: 50, timeoutMs: 200 });

    await vi.advanceTimersByTimeAsync(400);
    await pending;

    const calls = readStatus.mock.calls.length;

    await vi.advanceTimersByTimeAsync(400);

    expect(readStatus).toHaveBeenCalledTimes(calls);
  });

  it('waits the given interval between polls', async () => {
    const readStatus = vi.fn().mockResolvedValue('connected');

    const pending = waitForDisconnected({ readStatus, pollMs: 100, timeoutMs: 1_000 });

    await vi.advanceTimersByTimeAsync(50);

    expect(readStatus).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(60);

    expect(readStatus).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(2_000);
    await pending;
  });

  it('treats any other status as still connected', async () => {
    const readStatus = vi.fn().mockResolvedValue('reconnecting');

    const pending = waitForDisconnected({ readStatus, pollMs: 50, timeoutMs: 150 });

    await vi.advanceTimersByTimeAsync(300);

    await expect(pending).resolves.toBe(false);
  });
});
