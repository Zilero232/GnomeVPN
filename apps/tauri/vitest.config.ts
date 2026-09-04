import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'tauri',
    environment: 'node',
    include: ['scripts/**/*.test.mjs']
  }
});
