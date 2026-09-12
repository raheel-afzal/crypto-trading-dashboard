import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The service suite talks to a real Postgres, which may be a remote one.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
