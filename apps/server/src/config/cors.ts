import { filter, isEmpty, map, pipe, unique } from 'remeda';

import { validateEnv } from './env.schema';

const env = validateEnv(process.env);

const TAURI_ORIGINS = ['tauri://localhost', 'http://tauri.localhost', 'https://tauri.localhost', 'http://localhost', 'https://localhost'];

const originOf = (url: string): string | null => {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
};

const webOrigins = pipe(
  env.CORS_ORIGINS.split(','),
  map((origin) => origin.trim()),
  filter((origin) => !isEmpty(origin))
);

const clientOrigin = originOf(env.CLIENT_URL);

export const allowedOrigins = unique([...webOrigins, ...(clientOrigin ? [clientOrigin] : []), ...TAURI_ORIGINS]);
