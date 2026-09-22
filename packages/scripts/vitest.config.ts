import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'scripts',
    isolate: false,
    environment: 'node',
    include: ['src/**/*.test.ts']
  }
});
