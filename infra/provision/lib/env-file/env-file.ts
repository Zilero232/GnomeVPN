import { appendFile, readFile } from 'node:fs/promises';

const readLines = async (filePath: string): Promise<string[]> => {
  try {
    const raw = await readFile(filePath, 'utf8');

    return raw.split('\n');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }

    throw error;
  }
};

const findLine = (lines: string[], key: string): string | undefined =>
  lines.find((line) => line.startsWith(`${key}=`));

export const hasEnvKey = async (filePath: string, key: string): Promise<boolean> =>
  findLine(await readLines(filePath), key) !== undefined;

export const readEnvValue = async (filePath: string, key: string): Promise<string | null> => {
  const line = findLine(await readLines(filePath), key);

  return line ? line.slice(key.length + 1) : null;
};

export const appendEnvLine = async (
  filePath: string,
  key: string,
  value: string,
): Promise<void> => {
  if (await hasEnvKey(filePath, key)) {
    throw new Error(`Refusing to append ${key}: it already exists in ${filePath}`);
  }

  await appendFile(filePath, `${key}=${value}\n`);
};
