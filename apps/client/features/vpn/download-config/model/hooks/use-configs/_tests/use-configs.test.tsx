import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const listConfigs = vi.fn();
const listConfigStatus = vi.fn();

vi.mock('@/shared/api', () => ({ listConfigs, listConfigStatus }));

const { useConfigs } = await import('../use-configs');

const CONFIG = {
  country: 'Netherlands',
  countryCode: 'nl',
  createdAt: '2026-01-01T00:00:00.000Z',
  name: 'Laptop',
  nodeId: 'nl-1',
  protocol: 'hysteria2' as const
};

let seen: ReturnType<typeof useConfigs>;

const Probe = () => {
  seen = useConfigs();

  return null;
};

const renderProbe = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>
  );
};

beforeEach(() => {
  listConfigs.mockResolvedValue([
    { ...CONFIG, id: 'a', name: 'Laptop' },
    { ...CONFIG, id: 'b', name: 'Phone' }
  ]);

  listConfigStatus.mockResolvedValue({ onlineIds: [], revokedIds: [] });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('useConfigs', () => {
  it('reports a config the node still serves as neither online nor revoked', async () => {
    renderProbe();

    await waitFor(() => expect(seen.configs).toHaveLength(2));

    expect(seen.configs[0]).toMatchObject({ id: 'a', isOnline: false, isRevoked: false });
  });

  it('marks a config the node reports as connected', async () => {
    listConfigStatus.mockResolvedValue({ onlineIds: ['a'], revokedIds: [] });

    renderProbe();

    await waitFor(() => expect(seen.configs[0]?.isOnline).toBe(true));

    expect(seen.configs[1]?.isOnline).toBe(false);
  });

  it('marks a revoked config, so the user knows to issue a new one', async () => {
    listConfigStatus.mockResolvedValue({ onlineIds: [], revokedIds: ['b'] });

    renderProbe();

    await waitFor(() => expect(seen.configs[1]?.isRevoked).toBe(true));

    expect(seen.configs[0]?.isRevoked).toBe(false);
  });

  it('never reports a revoked config as online', async () => {
    listConfigStatus.mockResolvedValue({ onlineIds: [], revokedIds: ['a', 'b'] });

    renderProbe();

    await waitFor(() => expect(seen.configs.every((config) => config.isRevoked)).toBe(true));

    expect(seen.configs.some((config) => config.isOnline)).toBe(false);
  });

  it('treats a status response with no revoked list as nothing revoked', async () => {
    listConfigStatus.mockResolvedValue({ onlineIds: ['a'] });

    renderProbe();

    await waitFor(() => expect(seen.configs[0]?.isOnline).toBe(true));

    expect(seen.configs.some((config) => config.isRevoked)).toBe(false);
  });

  it('shows the configs before their status has arrived', async () => {
    listConfigStatus.mockReturnValue(new Promise(() => undefined));

    renderProbe();

    await waitFor(() => expect(seen.configs).toHaveLength(2));

    expect(seen.configs.every((config) => !config.isOnline && !config.isRevoked)).toBe(true);
  });

  it('asks for no status at all when the user has no configs', async () => {
    listConfigs.mockResolvedValue([]);

    renderProbe();

    await waitFor(() => expect(seen.isLoading).toBe(false));

    expect(listConfigStatus).not.toHaveBeenCalled();
  });

  it('survives a status request that fails, leaving the configs listed', async () => {
    listConfigStatus.mockRejectedValue(new Error('offline'));

    renderProbe();

    await waitFor(() => expect(seen.configs).toHaveLength(2));

    expect(seen.configs.every((config) => !config.isRevoked)).toBe(true);
  });
});
