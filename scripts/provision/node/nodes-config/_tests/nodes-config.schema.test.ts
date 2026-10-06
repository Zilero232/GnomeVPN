import { describe, expect, it } from 'vitest';

import { formatIssues } from '../nodes-config.helpers';
import { nodesConfigSchema } from '../nodes-config.schema';

const node = { host: '203.0.113.10', sshUser: 'root', sshPassword: 'x', country: 'Netherlands', countryCode: 'NL' };

describe('nodesConfigSchema', () => {
  it('accepts distinct nodes', () => {
    expect(nodesConfigSchema.safeParse([node, { ...node, host: '203.0.113.11', countryCode: 'FI' }]).success).toBe(true);
  });

  it('refuses two nodes on one country code, whose panel secrets would share env keys', () => {
    expect(nodesConfigSchema.safeParse([node, { ...node, host: '203.0.113.11' }]).success).toBe(false);
  });

  it('refuses the same host twice', () => {
    expect(nodesConfigSchema.safeParse([node, { ...node, countryCode: 'FI' }]).success).toBe(false);
  });

  it('refuses a country code that is not two uppercase letters, since it becomes an env key name', () => {
    expect(nodesConfigSchema.safeParse([{ ...node, countryCode: 'N=' }]).success).toBe(false);
  });
});

describe('formatIssues', () => {
  it('names the entry an issue belongs to', () => {
    const result = nodesConfigSchema.safeParse([{ ...node, host: '' }]);

    expect(formatIssues(result.error?.issues ?? [])).toContain('index 0: host');
  });

  it('names the field for an issue about the list as a whole', () => {
    const result = nodesConfigSchema.safeParse([node, node]);

    expect(formatIssues(result.error?.issues ?? [])).toContain(`countryCode — ${node.countryCode} appears more than once`);
  });
});
