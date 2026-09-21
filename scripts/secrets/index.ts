import { reporter } from '@gnomevpn/scripts/reporter';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { GenerateInput, SecretKey } from './secrets.types';

import { readEnvValue, upsertEnvGroup } from '../provision/node/env-file';
import { SECRET_BYTES, SECRET_ENCODINGS } from './secrets.constants';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const ENV_PATH = resolve(ROOT, '.env');

const log = reporter('secrets');

const ALL_KEYS: SecretKey[] = ['TELEGRAM_WEBHOOK_SECRET', 'BETTER_AUTH_SECRET'];

const isSecretKey = (value: string): value is SecretKey => Object.hasOwn(SECRET_ENCODINGS, value);

// Naming a key that does not exist is a typo, and silently generating nothing
// would look like success.
const requested = (): SecretKey[] => {
  const named = process.argv.slice(2).filter((argument) => !argument.startsWith('--'));

  if (named.length === 0) {
    return ALL_KEYS;
  }

  const unknown = named.filter((name) => !isSecretKey(name));

  if (unknown.length > 0) {
    log.fail(`unknown secret: ${unknown.join(', ')}. Known: ${ALL_KEYS.join(', ')}`);
  }

  return named.filter(isSecretKey);
};

// A secret already in place is left alone unless --force says otherwise:
// regenerating BETTER_AUTH_SECRET signs every live session out.
const generate = async ({ envPath, keys, isForced }: GenerateInput) => {
  const entries = [];

  for (const key of keys) {
    const existing = await readEnvValue({ filePath: envPath, key });

    if (existing && !isForced) {
      log.info(`${key} — already set, left alone`);

      continue;
    }

    entries.push({ key, value: randomBytes(SECRET_BYTES).toString(SECRET_ENCODINGS[key]) });

    log.info(`${key} — generated`);
  }

  if (entries.length === 0) {
    return;
  }

  await upsertEnvGroup({ filePath: envPath, entries });
};

await generate({ envPath: ENV_PATH, keys: requested(), isForced: process.argv.includes('--force') });
