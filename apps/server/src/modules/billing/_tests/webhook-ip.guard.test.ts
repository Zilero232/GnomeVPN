import { describe, expect, it } from 'vitest';

import { WebhookIpGuard } from '../webhook-ip.guard';

const makeContext = (ip: string) => ({
  switchToHttp: () => ({
    getRequest: () => ({ ip, socket: { remoteAddress: ip } }),
  }),
});

describe('WebhookIpGuard', () => {
  it('пропускает адрес из диапазона ЮKassa', () => {
    const guard = new WebhookIpGuard();

    expect(guard.canActivate(makeContext('185.71.76.10') as never)).toBe(true);
  });

  it('пропускает второй диапазон ЮKassa', () => {
    const guard = new WebhookIpGuard();

    expect(guard.canActivate(makeContext('77.75.156.20') as never)).toBe(true);
  });

  it('отклоняет посторонний адрес', () => {
    const guard = new WebhookIpGuard();

    expect(() => guard.canActivate(makeContext('8.8.8.8') as never)).toThrow();
  });

  it('пропускает localhost для локальной отладки', () => {
    const guard = new WebhookIpGuard();

    expect(guard.canActivate(makeContext('127.0.0.1') as never)).toBe(true);
  });

  it('разбирает IPv4-mapped адрес', () => {
    const guard = new WebhookIpGuard();

    expect(guard.canActivate(makeContext('::ffff:185.71.76.10') as never)).toBe(true);
  });

  it('отклоняет пустой адрес', () => {
    const guard = new WebhookIpGuard();

    expect(() => guard.canActivate(makeContext('') as never)).toThrow();
  });
});
