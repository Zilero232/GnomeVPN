import { describe, expect, it } from 'vitest';

import { NodesService } from '../nodes.service';

const rows = [
  {
    id: 'n1',
    country: 'Germany',
    countryCode: 'DE',
    flagEmoji: '🇩🇪',
    city: 'Frankfurt',
    enabled: true,
  },
];

const fakePrisma = {
  node: {
    findMany: async () => rows,
    findFirst: async ({ where }: { where: { id: string; enabled: boolean } }) =>
      where.id === 'n1'
        ? { id: 'n1', publicEndpoint: 'de:51820', wgEasyUrl: 'http://wg', wgEasyApiKeyRef: 'REF' }
        : null,
  },
} as never;

describe('NodesService', () => {
  it('listPublicNodes returns only public fields', async () => {
    const service = new NodesService(fakePrisma);
    const nodes = await service.listPublicNodes();
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).not.toHaveProperty('wgEasyUrl');
    expect(nodes[0].country).toBe('Germany');
  });

  it('getNodeForConnect throws for unknown node', async () => {
    const service = new NodesService(fakePrisma);
    await expect(service.getNodeForConnect('nope')).rejects.toThrow();
  });
});
