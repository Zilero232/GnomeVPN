import { afterEach, describe, expect, it, vi } from 'vitest';

import { reporter } from '../reporter';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('reporter', () => {
  it('prefixes an info message with the scope', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    reporter('provision').info('starting');

    expect(log).toHaveBeenCalledWith('[provision] starting');
  });

  it('marks a step with an arrow', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    reporter('provision').step('installing docker');

    expect(log).toHaveBeenCalledWith('[provision] → installing docker');
  });

  it('sends a warning to the warn stream', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    reporter('nodes').warn('node is unreachable');

    expect(warn).toHaveBeenCalledWith('[nodes] node is unreachable');
  });

  it('reports a failure on the error stream and exits with 1 by default', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);

    reporter('nodes').fail('cannot connect');

    expect(error).toHaveBeenCalledWith('[nodes] cannot connect');
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('exits with the given code', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);

    reporter('nodes').fail('cannot connect', 2);

    expect(exit).toHaveBeenCalledWith(2);
  });

  it('keeps each scope separate', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    reporter('ssh').info('connected');
    reporter('panel').info('logged in');

    expect(log).toHaveBeenNthCalledWith(1, '[ssh] connected');
    expect(log).toHaveBeenNthCalledWith(2, '[panel] logged in');
  });
});
