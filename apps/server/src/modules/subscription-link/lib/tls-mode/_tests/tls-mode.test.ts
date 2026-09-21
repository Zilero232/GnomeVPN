import { describe, expect, it } from 'vitest';

import { tlsMode } from '../tls-mode';
import { TLS_MODE } from '../tls-mode.constants';

describe('tlsMode', () => {
  it('pins for a client that never identifies itself, because a pin is the safer of the two', () => {
    expect(tlsMode(null)).toBe(TLS_MODE.pin);
    expect(tlsMode('')).toBe(TLS_MODE.pin);
  });

  it('pins for INCY and every other xray core, which refuses to start on the insecure flag', () => {
    expect(tlsMode('INCY/1.4.0/ios')).toBe(TLS_MODE.pin);
    expect(tlsMode('v2rayNG/1.9.5')).toBe(TLS_MODE.pin);
    expect(tlsMode('Mozilla/5.0')).toBe(TLS_MODE.pin);
  });

  it('skips verification for a sing-box client, which has no pinSHA256 support to fall back on', () => {
    expect(tlsMode('Hiddify/2.5.7')).toBe(TLS_MODE.skipVerify);
    expect(tlsMode('sing-box 1.11.0')).toBe(TLS_MODE.skipVerify);
    expect(tlsMode('SingBox/1.8')).toBe(TLS_MODE.skipVerify);
    expect(tlsMode('Streisand/2.0')).toBe(TLS_MODE.skipVerify);
    expect(tlsMode('ClashMetaForAndroid/2.11')).toBe(TLS_MODE.skipVerify);
  });

  it('matches the agent whatever case it arrives in, since none of them agree on one', () => {
    expect(tlsMode('HIDDIFY/2.0')).toBe(TLS_MODE.skipVerify);
    expect(tlsMode('hiddify/2.0')).toBe(TLS_MODE.skipVerify);
  });
});
