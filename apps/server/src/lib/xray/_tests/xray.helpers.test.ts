import { describe, expect, it, vi } from 'vitest';

import type { XrayInbound } from '../inbounds';

import { AUTH_BYTES } from '../xray.constants';
import {
  currentClients,
  generateAuth,
  parseSettings,
  parseSniffing,
  parseStreamSettings,
  parseWireguardSettings,
  stripCidrMask
} from '../xray.helpers';

const inbound = (patch: Partial<XrayInbound>): XrayInbound => ({
  id: 1,
  enable: true,
  remark: 'test',
  port: 443,
  settings: '{}',
  ...patch
});

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, reject, resolve };
};

const flush = () => new Promise((resolve) => setImmediate(resolve));

const freshSerializeByKey = async () => {
  vi.resetModules();

  const helpers = await import('../xray.helpers');

  return helpers.serializeByKey;
};

describe('stripCidrMask', () => {
  it('strips a trailing mask from an ipv4 address', () => {
    expect(stripCidrMask('10.9.0.2/24')).toBe('10.9.0.2');
  });

  it('leaves a plain address alone', () => {
    expect(stripCidrMask('10.9.0.2')).toBe('10.9.0.2');
  });

  it('strips a trailing mask from an ipv6 address', () => {
    expect(stripCidrMask('2a02:5180::1/32')).toBe('2a02:5180::1');
  });

  it('leaves a plain ipv6 address alone', () => {
    expect(stripCidrMask('2a02:5180::1')).toBe('2a02:5180::1');
  });

  it('strips only the last mask of a comma joined list', () => {
    expect(stripCidrMask('10.9.0.2/24,10.9.0.3/24')).toBe('10.9.0.2/24,10.9.0.3');
  });
});

describe('parseSettings', () => {
  it('parses a json string', () => {
    expect(parseSettings(inbound({ settings: '{"clients":[{"email":"a"}]}' }))).toEqual({ clients: [{ email: 'a' }] });
  });

  it('passes an already parsed object through', () => {
    const settings = { clients: [{ email: 'a' }] };

    expect(parseSettings(inbound({ settings }))).toBe(settings);
  });

  it('returns an empty object for undefined settings', () => {
    expect(parseSettings(inbound({ settings: undefined as unknown as string }))).toEqual({});
  });

  it('returns an empty object for malformed json', () => {
    expect(parseSettings(inbound({ settings: '{not json' }))).toEqual({});
  });
});

describe('parseStreamSettings', () => {
  it('parses a json string', () => {
    expect(parseStreamSettings(inbound({ streamSettings: '{"security":"tls"}' }))).toEqual({ security: 'tls' });
  });

  it('passes an already parsed object through', () => {
    const streamSettings = { security: 'tls' };

    expect(parseStreamSettings(inbound({ streamSettings }))).toBe(streamSettings);
  });

  it('returns an empty object when stream settings are absent', () => {
    expect(parseStreamSettings(inbound({}))).toEqual({});
  });

  it('returns an empty object for malformed json', () => {
    expect(parseStreamSettings(inbound({ streamSettings: '[' }))).toEqual({});
  });
});

describe('parseSniffing', () => {
  it('parses a json string', () => {
    expect(parseSniffing(inbound({ sniffing: '{"enabled":true}' }))).toEqual({ enabled: true });
  });

  it('passes an already parsed object through', () => {
    const sniffing = { enabled: true };

    expect(parseSniffing(inbound({ sniffing }))).toBe(sniffing);
  });

  it('returns an empty object when sniffing is absent', () => {
    expect(parseSniffing(inbound({}))).toEqual({});
  });

  it('returns an empty object for malformed json', () => {
    expect(parseSniffing(inbound({ sniffing: 'null,' }))).toEqual({});
  });
});

describe('parseWireguardSettings', () => {
  it('parses a json string', () => {
    expect(parseWireguardSettings(inbound({ settings: '{"secretKey":"key","mtu":1360}' }))).toEqual({ mtu: 1360, secretKey: 'key' });
  });

  it('passes an already parsed object through', () => {
    const settings = { mtu: 1360, secretKey: 'key' };

    expect(parseWireguardSettings(inbound({ settings }))).toBe(settings);
  });

  it('returns an empty object for undefined settings', () => {
    expect(parseWireguardSettings(inbound({ settings: undefined as unknown as string }))).toEqual({});
  });

  it('returns an empty object for malformed json', () => {
    expect(parseWireguardSettings(inbound({ settings: '{"secretKey":' }))).toEqual({});
  });
});

describe('currentClients', () => {
  it('returns the clients array', () => {
    expect(currentClients(inbound({ settings: '{"clients":[{"email":"a"},{"email":"b"}]}' }))).toEqual([{ email: 'a' }, { email: 'b' }]);
  });

  it('returns an empty array when settings carry no clients', () => {
    expect(currentClients(inbound({ settings: '{"secretKey":"key"}' }))).toEqual([]);
  });

  it('returns an empty array for malformed settings', () => {
    expect(currentClients(inbound({ settings: '{{{' }))).toEqual([]);
  });

  it('returns an empty array when clients is null', () => {
    expect(currentClients(inbound({ settings: '{"clients":null}' }))).toEqual([]);
  });
});

describe('generateAuth', () => {
  it('returns a lowercase hex string', () => {
    expect(generateAuth()).toMatch(/^[\da-f]+$/);
  });

  it('returns two hex characters per configured byte', () => {
    expect(generateAuth()).toHaveLength(AUTH_BYTES * 2);
  });

  it('returns a different value on every call', () => {
    expect(generateAuth()).not.toBe(generateAuth());
  });
});

describe('serializeByKey', () => {
  it('runs tasks for the same key one after another', async () => {
    const serializeByKey = await freshSerializeByKey();
    const first = deferred<string>();
    const second = deferred<string>();
    const order: string[] = [];

    const firstRun = serializeByKey('node', () => {
      order.push('first-start');

      return first.promise;
    });

    const secondRun = serializeByKey('node', () => {
      order.push('second-start');

      return second.promise;
    });

    await flush();
    expect(order).toEqual(['first-start']);

    first.resolve('a');
    await flush();
    expect(order).toEqual(['first-start', 'second-start']);

    second.resolve('b');

    await expect(firstRun).resolves.toBe('a');
    await expect(secondRun).resolves.toBe('b');
  });

  it('runs tasks for different keys concurrently', async () => {
    const serializeByKey = await freshSerializeByKey();
    const first = deferred<string>();
    const second = deferred<string>();
    const order: string[] = [];

    const firstRun = serializeByKey('node-a', () => {
      order.push('a-start');

      return first.promise;
    });

    const secondRun = serializeByKey('node-b', () => {
      order.push('b-start');

      return second.promise;
    });

    await flush();
    expect(order).toEqual(['a-start', 'b-start']);

    first.resolve('a');
    second.resolve('b');

    await expect(firstRun).resolves.toBe('a');
    await expect(secondRun).resolves.toBe('b');
  });

  it('lets the next task on a key run after the previous one rejected', async () => {
    const serializeByKey = await freshSerializeByKey();
    const first = deferred<string>();
    const second = deferred<string>();
    const order: string[] = [];

    const firstRun = serializeByKey('node', () => first.promise);

    firstRun.catch(() => undefined);

    const secondRun = serializeByKey('node', () => {
      order.push('second-start');

      return second.promise;
    });

    await flush();
    expect(order).toEqual([]);

    first.reject(new Error('boom'));
    await flush();
    expect(order).toEqual(['second-start']);

    second.resolve('b');

    await expect(secondRun).resolves.toBe('b');
  });

  it('leaves no unhandled rejection when a lone task fails', async () => {
    const serializeByKey = await freshSerializeByKey();
    const unhandled: unknown[] = [];
    const record = (reason: unknown) => unhandled.push(reason);

    process.on('unhandledRejection', record);

    try {
      await expect(serializeByKey('node', () => Promise.reject(new Error('panel is down')))).rejects.toThrow('panel is down');

      await flush();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(unhandled).toEqual([]);
    } finally {
      process.off('unhandledRejection', record);
    }
  });

  it('rejects for the caller whose task threw', async () => {
    const serializeByKey = await freshSerializeByKey();
    const failing = deferred<string>();

    const run = serializeByKey('node', () => failing.promise);
    const followUp = serializeByKey('node', () => Promise.resolve('next'));
    const settled = expect(run).rejects.toThrow('boom');

    failing.reject(new Error('boom'));

    await settled;
    await expect(followUp).resolves.toBe('next');
  });

  it('starts a fresh chain once every task on a key has settled', async () => {
    const serializeByKey = await freshSerializeByKey();
    const first = deferred<string>();

    const firstRun = serializeByKey('node', () => first.promise);

    first.resolve('a');
    await expect(firstRun).resolves.toBe('a');
    await flush();

    const order: string[] = [];

    const secondRun = serializeByKey('node', () => {
      order.push('second-start');

      return Promise.resolve('b');
    });

    await flush();
    expect(order).toEqual(['second-start']);

    await expect(secondRun).resolves.toBe('b');
  });
});
