import { defineConfig, devices } from '@playwright/test';

// Hosts the playground-web dev server for the whole test run.
export default defineConfig({
    testDir: './tests',
    timeout: 30_000,
    expect: { timeout: 5_000 },
    retries: process.env.CI ? 1 : 0,
    reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
    use: {
        baseURL: 'http://localhost:5173',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
    },
    webServer: {
        command: 'yarn workspace playground-web dev',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        stdout: 'pipe',
        stderr: 'pipe',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
