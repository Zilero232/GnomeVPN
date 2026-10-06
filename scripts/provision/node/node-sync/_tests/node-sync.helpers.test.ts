import { describe, expect, it } from 'vitest';

import type { SyncableNode } from '../node-sync.types';

import { applySqlCommand, buildNodeSync, restartServerCommand } from '../node-sync.helpers';

const node: SyncableNode = {
  country: 'Netherlands',
  countryCode: 'NL',
  city: null,
  host: '203.0.113.10',
  port: 443,
  serverName: 'www.bing.com',
  hysteriaAuth: 'secret',
  certFingerprint: null,
  realityPublicKey: null,
  realityShortId: null,
  apiUrl: 'http://203.0.113.10:2053/abc',
  apiTokenEnvVar: 'XRAY_KEY_NL',
  displayOrder: 0
};

describe('buildNodeSync', () => {
  it('refuses an empty list, which would turn into deleting every production node', () => {
    expect(() => buildNodeSync([])).toThrow();
  });

  it('runs inside one transaction', () => {
    const sql = buildNodeSync([node]);

    expect(sql.startsWith('BEGIN;')).toBe(true);
    expect(sql.trimEnd().endsWith('COMMIT;')).toBe(true);
  });

  it('escapes a quote in a value rather than ending the literal', () => {
    expect(buildNodeSync([{ ...node, city: "Hof van 's-Hertogenbosch" }])).toContain("'Hof van ''s-Hertogenbosch'");
  });

  it('writes a missing value as NULL, not as the text null', () => {
    expect(buildNodeSync([node])).toContain("'Netherlands', 'NL', NULL,");
  });
});

describe('applySqlCommand', () => {
  const sql = 'SELECT 1;';
  const delimiter = 'SQL_x';

  it('quotes a deploy path an operator could have set to anything', () => {
    const command = applySqlCommand({ deployPath: '/opt/my app; rm -rf /', sql, delimiter });

    expect(command.startsWith("cd '/opt/my app; rm -rf /' && ")).toBe(true);
  });

  it('closes the heredoc with the delimiter it opened', () => {
    const command = applySqlCommand({ deployPath: '/opt/gnomevpn', sql, delimiter });

    expect(command.endsWith([`<<'${delimiter}'`, sql, delimiter].join('\n'))).toBe(true);
  });

  it('refuses sql that would close its own heredoc early', () => {
    expect(() => applySqlCommand({ deployPath: '/opt/gnomevpn', sql: [sql, delimiter, 'rm -rf /'].join('\n'), delimiter })).toThrow();
  });
});

describe('restartServerCommand', () => {
  it('restarts from inside the deploy path', () => {
    expect(restartServerCommand('/opt/gnomevpn')).toBe('cd /opt/gnomevpn && docker compose restart server');
  });
});
