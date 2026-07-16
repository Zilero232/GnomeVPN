import { validateEnv } from './env.schema';

const env = validateEnv(process.env);

export const allowedOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());
