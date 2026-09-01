import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'server',
    environment: 'node',
    include: ['src/**/*.test.ts'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost:5433/test',
      DIRECT_URL: 'postgresql://test:test@localhost:5433/test',
      API_URL: 'http://localhost:4000',
      BETTER_AUTH_SECRET: 'test-secret-not-used-outside-tests',
      CLIENT_URL: 'http://localhost:3000',
      EMAIL_FROM: 'test@gnomevpn.invalid'
    }
  },
  resolve: {
    alias: {
      '@gnomevpn/schemas': resolve(import.meta.dirname, '../../packages/schemas/src')
    }
  }
});
