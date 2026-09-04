import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

const flush = () => new Promise((resolve) => setImmediate(resolve));

const freshSerializeByKey = async () => {
  vi.resetModules();

  const module = await import('../serialize');

  return module.serializeByKey;
};

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.resetModules();
});

describe('serializeByKey', () => {
  it('runs tasks for the same key one after another', async () => {
    const serializeByKey = await freshSerializeByKey();
    const first = deferred<string>();
    const second = deferred<string>();
    const order: string[] = [];

    const firstRun = serializeByKey({
      key: 'node',
      task: () => {
        order.push('first-start');

        return first.promise;
      }
    });

    const secondRun = serializeByKey({
      key: 'node',
      task: () => {
        order.push('second-start');

        return second.promise;
      }
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

    const firstRun = serializeByKey({
      key: 'node-a',
      task: () => {
        order.push('a-start');

        return first.promise;
      }
    });

    const secondRun = serializeByKey({
      key: 'node-b',
      task: () => {
        order.push('b-start');

        return second.promise;
      }
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

    const firstRun = serializeByKey({ key: 'node', task: () => first.promise });

    firstRun.catch(() => undefined);

    const secondRun = serializeByKey({
      key: 'node',
      task: () => {
        order.push('second-start');

        return second.promise;
      }
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
      await expect(serializeByKey({ key: 'node', task: () => Promise.reject(new Error('panel is down')) })).rejects.toThrow('panel is down');

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

    const run = serializeByKey({ key: 'node', task: () => failing.promise });
    const followUp = serializeByKey({ key: 'node', task: () => Promise.resolve('next') });
    const settled = expect(run).rejects.toThrow('boom');

    failing.reject(new Error('boom'));

    await settled;
    await expect(followUp).resolves.toBe('next');
  });

  it('starts a fresh chain once every task on a key has settled', async () => {
    const serializeByKey = await freshSerializeByKey();
    const first = deferred<string>();

    const firstRun = serializeByKey({ key: 'node', task: () => first.promise });

    first.resolve('a');
    await expect(firstRun).resolves.toBe('a');
    await flush();

    const order: string[] = [];

    const secondRun = serializeByKey({
      key: 'node',
      task: () => {
        order.push('second-start');

        return Promise.resolve('b');
      }
    });

    await flush();
    expect(order).toEqual(['second-start']);

    await expect(secondRun).resolves.toBe('b');
  });
});
