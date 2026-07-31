import { filter, isEmpty, map, pipe } from 'remeda';

import { validateEnv } from './env.schema';

const env = validateEnv(process.env);

const TAURI_ORIGINS = ['tauri://localhost', 'http://tauri.localhost', 'https://tauri.localhost', 'http://localhost', 'https://localhost'];

const webOrigins = pipe(
  env.CORS_ORIGINS.split(','),
  map((origin) => origin.trim()),
  filter((origin) => !isEmpty(origin))
);

export const allowedOrigins = [...webOrigins, ...TAURI_ORIGINS];
