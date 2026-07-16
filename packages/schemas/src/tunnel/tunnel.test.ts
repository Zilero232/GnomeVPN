import { describe, expect, it } from 'bun:test';
import { connectInputSchema, tunnelConfigSchema } from './index';

describe('tunnel schemas', () => {
  it('accepts a valid tunnel config', () => {
    const config = {
      privateKey: 'aGVsbG8=',
      address: '10.8.0.2/32',
      dns: '10.8.0.1',
      serverPublicKey: 'c2VydmVy',
      endpoint: 'de.vesper.example:51820',
      allowedIps: ['0.0.0.0/0', '::/0'],
      persistentKeepalive: 25,
    };
    expect(tunnelConfigSchema.parse(config)).toEqual(config);
  });

  it('rejects connect input without nodeId', () => {
    expect(connectInputSchema.safeParse({}).success).toBe(false);
  });

  it('rejects non-uuid nodeId', () => {
    expect(connectInputSchema.safeParse({ nodeId: 'not-a-uuid' }).success).toBe(false);
  });
});
