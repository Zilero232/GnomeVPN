import { z } from 'zod';

const apiUrl = process.env.NODE_ENV === 'production' ? z.url() : z.url().default('http://localhost:4000');

const schema = z.object({
  NEXT_PUBLIC_API_URL: apiUrl,
  NEXT_PUBLIC_APP_VERSION: z.string().min(1).default('0.0.0')
});

export const env = schema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION
});
