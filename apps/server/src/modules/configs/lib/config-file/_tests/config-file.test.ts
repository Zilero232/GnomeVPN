import type { TunnelConfig } from '@gnomevpn/schemas';

import { describe, expect, it } from 'vitest';

import { configFileName, renderHysteria2Config } from '../config-file';

const baseConfig: TunnelConfig = {
  protocol: 'hysteria2',
  server: '203.0.113.10',
  port: 443,
  auth: 'secret-password',
  serverName: 'www.microsoft.com',
  insecure: false,
  dns: ['1.1.1.1', '8.8.8.8']
};

describe('renderHysteria2Config', () => {
  it('builds a hy2 uri with the auth as the username and the port', () => {
    const result = renderHysteria2Config({ config: baseConfig, deviceName: 'MacBook', country: 'Germany' });

    expect(result.startsWith('hy2://secret-password@203.0.113.10:443/')).toBe(true);
  });

  it('carries the server name as the sni query parameter', () => {
    const result = renderHysteria2Config({ config: baseConfig, deviceName: 'MacBook', country: 'Germany' });

    expect(result).toContain('sni=www.microsoft.com');
  });

  it('omits insecure when the config does not ask for it', () => {
    const result = renderHysteria2Config({ config: baseConfig, deviceName: 'MacBook', country: 'Germany' });

    expect(result).not.toContain('insecure');
  });

  it('adds insecure=1 when the config is insecure', () => {
    const result = renderHysteria2Config({
      config: { ...baseConfig, insecure: true },
      deviceName: 'MacBook',
      country: 'Germany'
    });

    expect(result).toContain('insecure=1');
  });

  it('puts the country and device name into the fragment', () => {
    const result = renderHysteria2Config({ config: baseConfig, deviceName: 'MacBook', country: 'Germany' });

    expect(decodeURIComponent(result.split('#')[1])).toBe('GnomeVPN Germany · MacBook\n');
  });

  it('ends the rendered config with a newline', () => {
    const result = renderHysteria2Config({ config: baseConfig, deviceName: 'MacBook', country: 'Germany' });

    expect(result.endsWith('\n')).toBe(true);
  });

  it('percent-encodes an auth containing a colon or an at sign', () => {
    const result = renderHysteria2Config({
      config: { ...baseConfig, auth: 'pa:ss@word' },
      deviceName: 'MacBook',
      country: 'Germany'
    });

    expect(result).toContain('hy2://pa%3Ass%40word@203.0.113.10:443/');
  });

  it('renders the whole uri for a plain config', () => {
    const result = renderHysteria2Config({
      config: { ...baseConfig, insecure: true },
      deviceName: 'MacBook',
      country: 'Germany'
    });

    expect(result).toBe('hy2://secret-password@203.0.113.10:443/?sni=www.microsoft.com&insecure=1#GnomeVPN%20Germany%20%C2%B7%20MacBook\n');
  });
});

describe('configFileName', () => {
  it('joins the prefix, the country and the device name with dashes', () => {
    expect(configFileName({ country: 'Germany', deviceName: 'MacBook' })).toBe('GnomeVPN-Germany-MacBook');
  });

  it('drops the device segment when it is missing', () => {
    expect(configFileName({ country: 'Germany' })).toBe('GnomeVPN-Germany');
  });

  it('drops the device segment when it is an empty string', () => {
    expect(configFileName({ country: 'Germany', deviceName: '' })).toBe('GnomeVPN-Germany');
  });

  it('transliterates a cyrillic country name', () => {
    expect(configFileName({ country: 'Россия' })).toBe('GnomeVPN-Rossiya');
  });

  it('pascal-cases every part of a multi-word device name', () => {
    expect(configFileName({ country: 'Germany', deviceName: 'Ivan personal laptop' })).toBe('GnomeVPN-Germany-IvanPersonalLaptop');
  });

  it('splits a camel-cased device name into its own parts', () => {
    expect(configFileName({ country: 'Germany', deviceName: 'MacBook Pro' })).toBe('GnomeVPN-Germany-MacBookPro');
  });

  it('drops a country that slugifies to nothing', () => {
    expect(configFileName({ country: '---', deviceName: 'MacBook' })).toBe('GnomeVPN-MacBook');
  });
});
