import { describe, expect, it } from 'vitest';

import { connectInputSchema, tunnelConfigSchema } from '../index';

describe('tunnel schemas', () => {
  const baseConfig = {
    privateKey: 'aGVsbG8=',
    address: '10.8.0.2/32',
    dns: '10.8.0.1',
    serverPublicKey: 'c2VydmVy',
    endpoint: 'de.vesper.example:51820',
    allowedIps: ['0.0.0.0/0', '::/0'],
    persistentKeepalive: 25,
  };

  it('accepts a valid tunnel config', () => {
    expect(tunnelConfigSchema.parse({ ...baseConfig, presharedKey: null })).toEqual({
      ...baseConfig,
      presharedKey: null,
    });
  });

  it('keeps the preshared key wg-easy issues for every client', () => {
    const presharedKey = '28A9e7XuG5e4RHDfi29jL7C3byKPr7QyjObuOWXy3+s=';

    expect(tunnelConfigSchema.parse({ ...baseConfig, presharedKey }).presharedKey).toBe(
      presharedKey,
    );
  });

  it('defaults the preshared key to null when the node does not use one', () => {
    expect(tunnelConfigSchema.parse(baseConfig).presharedKey).toBeNull();
  });

  it('rejects connect input without nodeId', () => {
    expect(connectInputSchema.safeParse({}).success).toBe(false);
  });

  it('rejects non-uuid nodeId', () => {
    expect(connectInputSchema.safeParse({ nodeId: 'not-a-uuid' }).success).toBe(false);
  });
});
