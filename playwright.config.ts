import 'dotenv/config'
import { defineConfig, devices } from '@playwright/test'

/**
 * E2E config. Boots the real dev stack (Vite + the dev-api proxy that serves
 * api/*.ts) and drives it with the system Chrome. AstraPay stays in MOCK mode;
 * the short mock-pay delay keeps the payment poll fast.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { ASTRAPAY_MOCK_PAY_DELAY_MS: '1500' },
  },
})
