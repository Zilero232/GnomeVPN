import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.url(),
  DIRECT_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(1),
  API_URL: z.url(),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  YOOKASSA_SHOP_ID: z.string().default(''),
  YOOKASSA_SECRET_KEY: z.string().default(''),
  YOOKASSA_RETURN_URL: z.url().default('http://localhost:3000/account'),
  YOOKASSA_RECURRING: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),

  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.coerce.number().default(465),
  SMTP_SECURE: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
  SMTP_USER: z.string().default(''),
  SMTP_PASSWORD: z.string().default(''),
  EMAIL_FROM: z.string().default(''),
  DEV_EMAIL_OVERRIDE: z.email().optional(),

  CLIENT_URL: z.url().default('http://localhost:3000'),

  GITHUB_TOKEN: z.string().default(''),
});

export type Env = z.infer<typeof envSchema>;

export const validateEnv = (raw: Record<string, unknown>): Env => {
  const parsed = envSchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error(`Invalid environment:\n${z.prettifyError(parsed.error)}`);
  }

  return parsed.data;
};
