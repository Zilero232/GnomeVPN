import { readFile, writeFile } from 'node:fs/promises';

import type { EnvKeyInput, FindValueInput, PruneEnvKeysInput, UpsertEnvGroupInput } from './env-file.types';

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

const findValue = ({ raw, key }: FindValueInput): string | null => {
  const line = raw
    .split('\n')
    .map((entry) => entry.trimEnd())
    .find((entry) => entry.startsWith(`${key}=`));

  return line?.slice(key.length + 1) || null;
};

export const readEnvValue = async ({ filePath, key }: EnvKeyInput): Promise<string | null> => findValue({ raw: await read(filePath), key });

export const upsertEnvGroup = async ({ filePath, entries }: UpsertEnvGroupInput): Promise<void> => {
  const raw = await read(filePath);
  const keys = new Set(entries.map((entry) => entry.key));

  const kept = raw
    .split('\n')
    .filter((line) => !keys.has(line.trimEnd().split('=')[0]))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const group = entries.map(({ key, value }) => `${key}=${value}`).join('\n');
  const body = kept.length > 0 ? `${kept}\n\n${group}\n` : `${group}\n`;

  await writeFile(filePath, body, 'utf8');
};

export const pruneEnvKeys = async ({ filePath, prefix, keep }: PruneEnvKeysInput): Promise<string[]> => {
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
