import { CENSOR } from '@gnomevpn/logger';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const lines: string[] = [];

const readLines = () => lines.map((line) => JSON.parse(line) as Record<string, unknown>);

beforeEach(async () => {
  lines.length = 0;

  vi.resetModules();
  vi.stubEnv('LOG_FORMAT', 'json');
  vi.stubEnv('LOG_LEVEL', 'debug');

  vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
    lines.push(String(chunk));

    return true;
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const load = async () => (await import('../reporter')).reporter;

describe('reporter', () => {
  it('tags every line with its scope, so one run can be read per concern', async () => {
    const reporter = await load();

    reporter('provision').info('starting');

    expect(readLines()[0]).toMatchObject({ scope: 'provision', msg: 'starting' });
  });

  it('marks a step with an arrow', async () => {
    const reporter = await load();

    reporter('provision').step('installing docker');

    expect(readLines()[0]).toMatchObject({ msg: '→ installing docker' });
  });

  it('separates a warning from an info by level rather than by stream', async () => {
    const reporter = await load();
    const log = reporter('nodes');

    log.info('connected');
    log.warn('node is unreachable');

    const [info, warning] = readLines();

    expect(Number(info.level)).toBeLessThan(Number(warning.level));
  });

  it('carries structured fields, which is the whole point of logging as data', async () => {
    const reporter = await load();

    reporter('provision').info('node ready', { country: 'DE', host: '203.0.113.10' });

    expect(readLines()[0]).toMatchObject({ country: 'DE', host: '203.0.113.10' });
  });

  it('censors a secret rather than printing it into a log somebody pastes into an issue', async () => {
    const reporter = await load();

    reporter('provision').info('connecting', { sshPassword: 'hunter2', token: 'abc' });

    const line = readLines()[0];

    expect(line.sshPassword).toBe(CENSOR);
    expect(line.token).toBe(CENSOR);
  });

  it('exits with 1 by default and with the code it is given', async () => {
    const reporter = await load();
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);

    reporter('nodes').fail('cannot connect');
    expect(exit).toHaveBeenLastCalledWith(1);

    reporter('nodes').fail('cannot connect', 2);
    expect(exit).toHaveBeenLastCalledWith(2);
  });

  it('keeps each scope separate', async () => {
    const reporter = await load();

    reporter('ssh').info('connected');
    reporter('panel').info('logged in');

    expect(readLines().map((line) => line.scope)).toEqual(['ssh', 'panel']);
  });
});
