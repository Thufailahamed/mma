import { defineConfig, devices } from '@playwright/test'

/**
 * The API origin decides whether a local Worker is needed:
 * a remote https origin means the backend is already deployed, so only the
 * frontend is started. A localhost origin means the Worker runs locally too.
 */
const apiOrigin = process.env.API_ORIGIN ?? 'http://localhost:8787'
const backendIsLocal = apiOrigin.includes('localhost') || apiOrigin.includes('127.0.0.1')

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    // Chromium-based so a single browser download covers both projects.
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    ...(backendIsLocal
      ? [
          {
            command: 'pnpm --filter @mma/api dev',
            url: 'http://localhost:8787/api/health',
            reuseExistingServer: true,
            timeout: 120_000,
            cwd: '../..',
          },
        ]
      : []),
    {
      command: 'pnpm --filter @mma/web dev',
      url: 'http://localhost:3000',
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
})
