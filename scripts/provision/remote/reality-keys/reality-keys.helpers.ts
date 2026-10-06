import { all, arg, line, orElse } from '@gnomevpn/scripts/shell';

import type { SeedRealityKeysScriptInput } from './reality-keys.types';

export const seedRealityKeysScript = ({ dir, seed }: SeedRealityKeysScriptInput): string => {
  const isComplete = all(seed.map(({ path }) => line(['test', '-s', arg(path)])));
  const write = all(seed.map(({ path, value }) => `printf '%s\\n' ${arg(value)} > ${arg(path)}`));
  const read = seed.map(({ path }) => line(['awk', arg('NR==1{print; exit}'), arg(path)]));

  return all([line(['mkdir', '-p', arg(dir)]), `{ ${orElse([`{ ${isComplete}; }`, `{ ${write}; }`])}; }`, ...read]);
};
