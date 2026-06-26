import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    launchOptions: {
      executablePath: '/opt/pw-browsers/chromium',
    },
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    timeout: 30000,
    reuseExistingServer: true,
  },
})
