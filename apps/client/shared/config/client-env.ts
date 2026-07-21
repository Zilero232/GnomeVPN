import { z } from 'zod';

const schema = z.object({
  NEXT_PUBLIC_API_URL: z.url().default('http://localhost:4000'),
  NEXT_PUBLIC_APP_VERSION: z.string().min(1).default('0.0.0'),
  NEXT_PUBLIC_YANDEX_VERIFICATION: z.string().default(''),
  NEXT_PUBLIC_GOOGLE_VERIFICATION: z.string().default(''),
});

export const env = schema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
  NEXT_PUBLIC_YANDEX_VERIFICATION: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
  NEXT_PUBLIC_GOOGLE_VERIFICATION: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
});
