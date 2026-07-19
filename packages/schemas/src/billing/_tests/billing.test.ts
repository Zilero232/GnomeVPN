import { describe, expect, it } from 'vitest';

import { webhookEventSchema } from '../inputs';

describe('webhookEventSchema', () => {
  it('разбирает payment.succeeded', () => {
    const parsed = webhookEventSchema.parse({
      event: 'payment.succeeded',
      object: { id: 'pay-1', status: 'succeeded' },
    });

    expect(parsed.event).toBe('payment.succeeded');
    expect(parsed.object.id).toBe('pay-1');
  });

  it('отклоняет неизвестное событие', () => {
    const result = webhookEventSchema.safeParse({
      event: 'payment.exploded',
      object: { id: 'pay-1', status: 'succeeded' },
    });

    expect(result.success).toBe(false);
  });

  it('требует id платежа', () => {
    const result = webhookEventSchema.safeParse({
      event: 'payment.succeeded',
      object: { status: 'succeeded' },
    });

    expect(result.success).toBe(false);
  });
});
