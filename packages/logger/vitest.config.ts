import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'logger',
    isolate: false,
    environment: 'node',
    include: ['src/**/*.test.ts']
  }
});
