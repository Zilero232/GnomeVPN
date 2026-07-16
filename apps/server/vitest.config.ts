import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      NODE_ENV: 'test',
      PORT: '4000',
      DATABASE_URL: 'postgresql://vesper:vesper@localhost:5432/vesper',
      DIRECT_URL: 'postgresql://vesper:vesper@localhost:5432/vesper',
      BETTER_AUTH_SECRET: 'test-secret-change-me-min-32-chars-000',
      BETTER_AUTH_URL: 'http://localhost:4000',
      CORS_ORIGINS: 'http://localhost:3000',
    },
  },
});
