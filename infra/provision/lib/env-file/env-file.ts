import { appendFile, readFile } from 'node:fs/promises';

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

export const hasEnvKey = async (filePath: string, key: string): Promise<boolean> =>
  findValue(await read(filePath), key) !== null;

export const readEnvValue = async (filePath: string, key: string): Promise<string | null> =>
  findValue(await read(filePath), key);

export const appendEnvLine = async (
  filePath: string,
  key: string,
  value: string,
): Promise<void> => {
  const raw = await read(filePath);

  if (findValue(raw, key) !== null) {
    throw new Error(`Refusing to append ${key}: it already exists in ${filePath}`);
  }

  const separator = raw.length > 0 && !raw.endsWith('\n') ? '\n' : '';

  await appendFile(filePath, `${separator}${key}=${value}\n`);
};
