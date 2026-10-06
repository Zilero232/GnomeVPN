import { describe, expect, it } from 'vitest';

import { devicePeerName } from '../device-peer-name';

describe('devicePeerName', () => {
  it('names the peer after the first twelve hex digits of the device id', () => {
    expect(devicePeerName('3f2a9c1e-7b44-4d2a-9e0b-1c2d3e4f5a6b')).toBe('d-3f2a9c1e7b44');
  });

  it('gives two devices two names', () => {
    expect(devicePeerName('11111111-1111-4111-8111-111111111111')).not.toBe(devicePeerName('22222222-2222-4222-8222-222222222222'));
  });
});
