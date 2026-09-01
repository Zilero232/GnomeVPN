import { afterEach, describe, expect, it, vi } from 'vitest';

import { settleAll } from '../settle';

vi.mock('../../logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() }
}));

const { logger } = await import('../../logger');

afterEach(() => {
  vi.clearAllMocks();
});

describe('settleAll', () => {
  it('resolves once every task has settled', async () => {
    const order: string[] = [];

    await settleAll({
      label: 'disconnect',
      tasks: [Promise.resolve().then(() => void order.push('first')), Promise.resolve().then(() => void order.push('second'))]
    });

    expect(order).toEqual(['first', 'second']);
  });

  it('does not reject when a task fails', async () => {
    await expect(settleAll({ label: 'disconnect', tasks: [Promise.reject(new Error('boom'))] })).resolves.toBeUndefined();
  });

  it('logs a warning for each rejected task, labelled', async () => {
    await settleAll({
      label: 'release peers',
      tasks: [Promise.resolve(), Promise.reject(new Error('node down')), Promise.reject(new Error('timeout'))]
    });

    expect(logger.warn).toHaveBeenCalledTimes(2);
    expect(logger.warn).toHaveBeenCalledWith('release peers failed: Error: node down');
    expect(logger.warn).toHaveBeenCalledWith('release peers failed: Error: timeout');
  });

  it('stays quiet when every task succeeds', async () => {
    await settleAll({ label: 'disconnect', tasks: [Promise.resolve(), Promise.resolve()] });

    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('runs a failing task without cancelling the rest', async () => {
    const done: string[] = [];

    await settleAll({
      label: 'disconnect',
      tasks: [Promise.reject(new Error('boom')), Promise.resolve().then(() => void done.push('ran'))]
    });

    expect(done).toEqual(['ran']);
  });

  it('accepts an empty task list', async () => {
    await expect(settleAll({ label: 'disconnect', tasks: [] })).resolves.toBeUndefined();

    expect(logger.warn).not.toHaveBeenCalled();
  });
});
