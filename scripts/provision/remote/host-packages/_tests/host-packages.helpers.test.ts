import { describe, expect, it } from 'vitest';

import { FAIL2BAN } from '../host-packages.constants';
import { fail2banJail } from '../host-packages.helpers';

describe('fail2banJail', () => {
  it('enables the ssh jail, which is the whole reason the file exists', () => {
    const jail = fail2banJail();

    expect(jail).toContain('[sshd]');
    expect(jail).toContain('enabled = true');
  });

  it('carries the thresholds the constants name, so one edit changes both', () => {
    const jail = fail2banJail();

    expect(jail).toContain(`maxretry = ${FAIL2BAN.maxRetry}`);
    expect(jail).toContain(`findtime = ${FAIL2BAN.findTimeSeconds}`);
    expect(jail).toContain(`bantime = ${FAIL2BAN.banTimeSeconds}`);
  });

  it('reads the journal rather than a log file, because the nodes ship without rsyslog', () => {
    expect(fail2banJail()).toContain('backend = systemd');
  });

  it('ends with a newline, which fail2ban needs to read the last directive', () => {
    expect(fail2banJail().endsWith('\n')).toBe(true);
  });
});
