import { appendFile, readFile, writeFile } from 'node:fs/promises';

import type { AppendEnvLineInput, EnvKeyInput, PruneEnvKeysInput } from './env-file.types';

const read = async (filePath: string): Promise<string> => {
  try {
    return await readFile(filePath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return '';
    }

    throw error;
  }
};

const findValue = (raw: string, key: string): string | null => {
  const line = raw
    .split('\n')
    .map((entry) => entry.trimEnd())
    .find((entry) => entry.startsWith(`${key}=`));

  return line?.slice(key.length + 1) || null;
};

export const hasEnvKey = async ({ filePath, key }: EnvKeyInput): Promise<boolean> =>
  findValue(await read(filePath), key) !== null;

export const readEnvValue = async ({ filePath, key }: EnvKeyInput): Promise<string | null> =>
  findValue(await read(filePath), key);

export const appendEnvLine = async ({
  filePath,
  key,
  value,
}: AppendEnvLineInput): Promise<void> => {
  const raw = await read(filePath);

  if (findValue(raw, key) !== null) {
    throw new Error(`Refusing to append ${key}: it already exists in ${filePath}`);
  }

  const separator = raw.length > 0 && !raw.endsWith('\n') ? '\n' : '';

  await appendFile(filePath, `${separator}${key}=${value}\n`);
};

export const pruneEnvKeys = async ({
  filePath,
  prefix,
  keep,
}: PruneEnvKeysInput): Promise<string[]> => {
  const raw = await read(filePath);

  if (raw.length === 0) {
    return [];
  }

  const kept = new Set(keep);
  const removed: string[] = [];

  const lines = raw.split('\n').filter((line) => {
    const key = line.trimEnd().split('=')[0];

    if (!key.startsWith(prefix) || kept.has(key)) {
      return true;
    }

    removed.push(key);

    return false;
  });

  if (removed.length > 0) {
    await writeFile(filePath, lines.join('\n'), 'utf8');
  }

  return removed;
};
