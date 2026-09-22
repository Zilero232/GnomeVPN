import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'provision',
    isolate: false,
    environment: 'node',
    include: ['**/*.test.ts']
  }
});
