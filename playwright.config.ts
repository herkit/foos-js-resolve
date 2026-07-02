import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config. Nest serves both the built SPA (client-dist) and the API on :3000,
 * so Playwright drives the real app through one origin.
 *
 * Prerequisites:
 *   - Postgres running (docker compose up -d in this dir)
 *   - SPA built:  (repo root) npm run web:build
 *   - API built:  pnpm build
 */
const PORT = process.env.E2E_PORT ?? '3000';
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  // The migrated-data suite needs the read-only foos_migrated DB; it has its own
  // config (playwright.migrated.config.ts / `pnpm e2e:migrated`).
  testIgnore: '**/migrated-data.spec.ts',
  timeout: 60_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node dist/main.js',
    url: `${BASE_URL}/api/players`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      EVENTSTORE_CONNECTION_STRING:
        process.env.EVENTSTORE_CONNECTION_STRING ??
        'postgresql://foos:foos@localhost:5432/foos',
      PORT,
    },
  },
});
