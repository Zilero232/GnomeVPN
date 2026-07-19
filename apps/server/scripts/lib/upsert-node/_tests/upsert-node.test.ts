import { describe, expect, it, vi } from 'vitest';

import { upsertNode } from '../upsert-node';

const baseInput = {
  country: 'Germany',
  countryCode: 'DE',
  flagEmoji: '🇩🇪',
  city: 'Frankfurt',
  publicEndpoint: '203.0.113.10:51820',
  wgEasyUrl: 'http://203.0.113.10:51821',
  wgEasyApiKeyRef: 'WG_KEY_DE',
};

describe('upsertNode', () => {
  it('creates a new node when none exists for the endpoint', async () => {
    const create = vi.fn(async () => ({ id: 'new-id' }));
    const fakePrisma = {
      node: { findFirst: vi.fn(async () => null), update: vi.fn(), create },
    } as never;

    const result = await upsertNode(fakePrisma, baseInput);

    expect(result).toEqual({ id: 'new-id', wasExisting: false });
    expect(create).toHaveBeenCalledWith({
      data: {
        country: 'Germany',
        countryCode: 'DE',
        flagEmoji: '🇩🇪',
        city: 'Frankfurt',
        publicEndpoint: '203.0.113.10:51820',
        wgEasyUrl: 'http://203.0.113.10:51821',
        wgEasyApiKeyRef: 'WG_KEY_DE',
        enabled: true,
      },
    });
  });

  it('updates the existing node when one is found for the endpoint', async () => {
    const update = vi.fn(async () => ({ id: 'existing-id' }));
    const fakePrisma = {
      node: {
        findFirst: vi.fn(async () => ({ id: 'existing-id' })),
        update,
        create: vi.fn(),
      },
    } as never;

    const result = await upsertNode(fakePrisma, baseInput);

    expect(result).toEqual({ id: 'existing-id', wasExisting: true });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'existing-id' },
      data: {
        country: 'Germany',
        countryCode: 'DE',
        flagEmoji: '🇩🇪',
        city: 'Frankfurt',
        wgEasyUrl: 'http://203.0.113.10:51821',
        wgEasyApiKeyRef: 'WG_KEY_DE',
        enabled: true,
      },
    });
  });

  it('looks up the existing node by publicEndpoint', async () => {
    const findFirst = vi.fn(async () => null);
    const fakePrisma = {
      node: { findFirst, update: vi.fn(), create: vi.fn(async () => ({ id: 'x' })) },
    } as never;

    await upsertNode(fakePrisma, baseInput);

    expect(findFirst).toHaveBeenCalledWith({ where: { publicEndpoint: '203.0.113.10:51820' } });
  });
});
