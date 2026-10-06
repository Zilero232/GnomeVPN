import { describe, expect, it } from 'vitest';

import { seedRealityKeysScript } from '../reality-keys.helpers';

const dir = '/etc/gnomevpn';

const seed = [
  { path: `${dir}/reality.key`, value: 'private' },
  { path: `${dir}/reality.pub`, value: 'public' },
  { path: `${dir}/reality.sid`, value: 'ab' }
];

describe('seedRealityKeysScript', () => {
  it('writes the keys only when any of them is missing, so a pair is never half replaced', () => {
    const guard = seed.map(({ path }) => `test -s ${path}`).join(' && ');

    expect(seedRealityKeysScript({ dir, seed })).toContain(`{ { ${guard}; } || {`);
  });

  it('reads the keys back in the order they were seeded', () => {
    const script = seedRealityKeysScript({ dir, seed });
    const reads = seed.map(({ path }) => script.lastIndexOf(`exit}' ${path}`));

    expect(reads.every((index) => index > 0)).toBe(true);
    expect(reads).toEqual([...reads].sort((left, right) => left - right));
  });

  it('quotes a value, so a key is written as data and never run', () => {
    const script = seedRealityKeysScript({ dir, seed: [{ path: seed[0].path, value: '$(reboot)' }] });

    expect(script).toContain(`'$(reboot)' > ${seed[0].path}`);
  });
});
