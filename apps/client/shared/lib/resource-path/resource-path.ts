import { resolveResource } from '@tauri-apps/api/path';

import { logger } from '../logger';

const cache = new Map<string, string>();

export const resolveBundledResource = async (relativePath: string): Promise<string> => {
  const cached = cache.get(relativePath);

  if (cached) {
    return cached;
  }

  try {
    const resolved = await resolveResource(relativePath);

    cache.set(relativePath, resolved);

    return resolved;
  } catch (error) {
    logger.warn(`cannot resolve ${relativePath}: ${String(error)}`);

    return relativePath;
  }
};
