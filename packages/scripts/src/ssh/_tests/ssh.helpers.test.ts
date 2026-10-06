import { describe, expect, it } from 'vitest';

import { failureOf } from '../ssh.helpers';

describe('failureOf', () => {
  it('names the exit code, so a signal is not mistaken for an ordinary failure', () => {
    expect(failureOf({ stdout: '', stderr: 'boom', exitCode: 137 })).toContain('137');
  });

  it('prefers stderr, which is where a failing command says why', () => {
    expect(failureOf({ stdout: 'progress', stderr: 'permission denied\n', exitCode: 1 })).toContain('permission denied');
  });

  it('falls back to stdout when stderr is empty', () => {
    expect(failureOf({ stdout: 'E: unable to locate package', stderr: '  ', exitCode: 100 })).toContain('unable to locate package');
  });

  it('still says something when the command printed nothing', () => {
    expect(failureOf({ stdout: '', stderr: '', exitCode: 1 })).toContain('no output');
  });
});
