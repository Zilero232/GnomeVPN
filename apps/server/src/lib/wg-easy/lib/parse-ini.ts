import type { ParseIniValueInput } from './parse-ini.types';

export const parseIniValue = ({ config, section, key }: ParseIniValueInput): string | null => {
  const lines = config.split('\n').map((line) => line.trim());
  const start = lines.findIndex((line) => line.toLowerCase() === `[${section.toLowerCase()}]`);

  if (start === -1) {
    return null;
  }

  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];

    if (line.startsWith('[')) {
      break;
    }

    const separator = line.indexOf('=');

    if (separator === -1) {
      continue;
    }

    if (line.slice(0, separator).trim().toLowerCase() === key.toLowerCase()) {
      return line.slice(separator + 1).trim();
    }
  }

  return null;
};
