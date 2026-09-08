import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const probeNodeLatency = vi.fn();
const listNodeEndpoints = vi.fn();
const useCurrentUser = vi.fn();
const usePlatform = vi.fn();

vi.mock('@/shared/lib', () => ({ probeNodeLatency }));
vi.mock('@/shared/api', () => ({ listNodeEndpoints }));
vi.mock('@/entities/auth/user', () => ({ useCurrentUser }));
vi.mock('@/entities/app/platform', () => ({ usePlatform }));

const { useNodeLatency } = await import('../use-node-latency');

let seen: ReturnType<typeof useNodeLatency>;

const Probe = ({ isEnabled }: { isEnabled: boolean }) => {
  seen = useNodeLatency({ isEnabled });

  return null;
};

const renderProbe = (isEnabled: boolean) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={client}>
      <Probe isEnabled={isEnabled} />
    </QueryClientProvider>
  );
};

beforeEach(() => {
  useCurrentUser.mockReturnValue({ isAuthenticated: true });
  usePlatform.mockReturnValue({ isNativeApp: true });
  listNodeEndpoints.mockResolvedValue([{ id: 'nl-1', server: '203.0.113.10', port: 443 }]);
  probeNodeLatency.mockResolvedValue({ 'nl-1': 42 });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('useNodeLatency', () => {
  it('reports an empty map before the first measurement lands', () => {
    probeNodeLatency.mockReturnValue(new Promise(() => undefined));

    renderProbe(true);

    expect(seen.latency).toEqual({});
  });

  it('reports the measured round trips', async () => {
    renderProbe(true);

    await waitFor(() => expect(seen.latency).toEqual({ 'nl-1': 42 }));
  });

  it('measures nothing while disabled', () => {
    renderProbe(false);

    expect(probeNodeLatency).not.toHaveBeenCalled();
  });

  it('keeps the last measurement when it becomes disabled, so connecting does not blank the list', async () => {
    const view = renderProbe(true);

    await waitFor(() => expect(seen.latency).toEqual({ 'nl-1': 42 }));

    view.rerender(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <Probe isEnabled={false} />
      </QueryClientProvider>
    );

    expect(seen.latency).toEqual({ 'nl-1': 42 });
  });

  it('measures nothing for a signed-out user', () => {
    useCurrentUser.mockReturnValue({ isAuthenticated: false });

    renderProbe(true);

    expect(probeNodeLatency).not.toHaveBeenCalled();
  });

  it('measures nothing in the browser, where there is no rust to probe with', () => {
    usePlatform.mockReturnValue({ isNativeApp: false });

    renderProbe(true);

    expect(probeNodeLatency).not.toHaveBeenCalled();
  });

  it('reports that it is measuring while the probe is in flight', async () => {
    probeNodeLatency.mockReturnValue(new Promise(() => undefined));

    renderProbe(true);

    await waitFor(() => expect(seen.isMeasuring).toBe(true));
  });

  it('survives a probe that fails, leaving the list empty rather than crashing', async () => {
    probeNodeLatency.mockRejectedValue(new Error('no rust'));

    renderProbe(true);

    await waitFor(() => expect(seen.isMeasuring).toBe(false));

    expect(seen.latency).toEqual({});
  });
});
