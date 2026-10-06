import { describe, expect, it } from 'vitest';

import { all, arg, dirOf, dockerExec, dockerShell, line, orElse, quiet, silent } from '../shell';

describe('arg', () => {
  it('leaves a plain token unquoted', () => {
    expect(arg('gnomevpn')).toBe('gnomevpn');
  });

  it('quotes a value containing spaces', () => {
    expect(arg('my node')).toBe("'my node'");
  });

  it('neutralises a command substitution', () => {
    expect(arg('$(rm -rf /)')).toBe("'$(rm -rf /)'");
  });

  it('neutralises a command separator', () => {
    expect(arg('node; rm -rf /')).toBe("'node; rm -rf /'");
  });

  it('closes, escapes and reopens the quote around an embedded single quote', () => {
    expect(arg("it's")).toBe(String.raw`'it'\''s'`);
  });

  it('quotes a backtick so the shell cannot expand it', () => {
    expect(arg('`whoami`')).toBe("'`whoami`'");
  });

  it('keeps an exclamation mark literal beside a quote, which a double-quoted sh string does not', () => {
    expect(arg("it's!")).toBe(String.raw`'it'\''s!'`);
  });

  it('keeps a backslash literal', () => {
    expect(arg(String.raw`a\nb`)).toBe(String.raw`'a\nb'`);
  });

  it('stringifies a number', () => {
    expect(arg(443)).toBe('443');
  });

  it('quotes an empty string rather than dropping it', () => {
    expect(arg('')).toBe("''");
  });
});

describe('line', () => {
  it('joins parts with a single space', () => {
    expect(line(['docker', 'ps', '-a'])).toBe('docker ps -a');
  });

  it('stringifies numeric parts', () => {
    expect(line(['sleep', 5])).toBe('sleep 5');
  });

  it('returns an empty string for no parts', () => {
    expect(line([])).toBe('');
  });
});

describe('all', () => {
  it('chains commands so a failure stops the rest', () => {
    expect(all(['cd /opt', 'ls'])).toBe('cd /opt && ls');
  });

  it('returns a single command unchanged', () => {
    expect(all(['ls'])).toBe('ls');
  });
});

describe('orElse', () => {
  it('chains commands so the next runs only on failure', () => {
    expect(orElse(['which docker', 'echo missing'])).toBe('which docker || echo missing');
  });
});

describe('silent', () => {
  it('drops both stdout and stderr', () => {
    expect(silent('systemctl status')).toBe('systemctl status >/dev/null 2>&1');
  });
});

describe('quiet', () => {
  it('keeps stdout and drops stderr', () => {
    expect(quiet('cat missing')).toBe('cat missing 2>/dev/null');
  });
});

describe('dockerExec', () => {
  it('builds an exec command from the argv parts', () => {
    expect(dockerExec({ container: '3x-ui', argv: ['ls', '-a'] })).toBe('docker exec 3x-ui ls -a');
  });
});

describe('dockerShell', () => {
  it('wraps the script as one quoted argument to sh -lc', () => {
    expect(dockerShell({ container: '3x-ui', script: 'ls -a' })).toBe("docker exec 3x-ui sh -lc 'ls -a'");
  });

  it('keeps an injected separator inside the quoted script', () => {
    const command = dockerShell({ container: '3x-ui', script: 'echo hi; rm -rf /' });

    expect(command).toBe("docker exec 3x-ui sh -lc 'echo hi; rm -rf /'");
  });
});

describe('dirOf', () => {
  it('drops the last segment of a path', () => {
    expect(dirOf('/opt/gnomevpn/docker-compose.yml')).toBe('/opt/gnomevpn');
  });

  it('keeps the root for a top-level path', () => {
    expect(dirOf('/file.txt')).toBe('/');
  });

  it('answers the current directory for a bare file name rather than eating its last character', () => {
    expect(dirOf('file.txt')).toBe('.');
  });
});
