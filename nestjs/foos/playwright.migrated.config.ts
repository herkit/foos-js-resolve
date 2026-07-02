import { defineConfig, devices } from '@playwright/test';

/**
 * Read-only E2E against the migrated production data (foos_migrated).
 *
 * Prerequisites:
 *   - Postgres running; the Phase 4 migration has populated `foos_migrated`
 *     (see migrate/README.md)
 *   - SPA + API built (npm run web:build at root; pnpm build here)
 *
 * Run: `pnpm e2e:migrated`
 */
const PORT = process.env.E2E_PORT ?? '3000';
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/migrated-data.spec.ts',
  timeout: 60_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: BASE_URL, trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node dist/main.js',
    url: `${BASE_URL}/api/players`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      EVENTSTORE_CONNECTION_STRING:
        'postgresql://foos:foos@localhost:5432/foos_migrated',
      PORT,
    },
  },
});
