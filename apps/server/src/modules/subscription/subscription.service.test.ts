import { describe, expect, it } from 'bun:test';
import { SubscriptionService } from './subscription.service';

const fakePrisma = {
  subscription: {
    findUnique: async () => ({ status: 'active', currentPeriodEnd: null }),
  },
} as never;

describe('SubscriptionService (stage 1 stub)', () => {
  it('hasActiveAccess always returns true', async () => {
    const service = new SubscriptionService(fakePrisma);
    expect(await service.hasActiveAccess('any-user')).toBe(true);
  });

  it('getStatus maps db row', async () => {
    const service = new SubscriptionService(fakePrisma);
    const status = await service.getStatus('any-user');
    expect(status.status).toBe('active');
  });
});
