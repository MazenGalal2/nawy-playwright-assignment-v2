import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  // 90 s gives headed cold-start (Windows + AV scan + browser launch) room
  // to settle without forfeiting a real-test slowness signal.
  timeout: 90_000,
  expect: { timeout: 10_000 },

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 2,
  workers: process.env.CI ? 2 : undefined,

  reporter: [
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["list"],
  ],

  use: {
    baseURL: process.env.UI_BASE_URL ?? "https://practicesoftwaretesting.com",
    testIdAttribute: "data-test",
    // Headed by default so a reviewer running `npm test` sees the browsers
    // drive the flow. Override with `HEADLESS=1 npm test` in CI environments
    // that lack a display server.
    headless: process.env.HEADLESS === "1" || process.env.CI === "true",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
    extraHTTPHeaders: {
      Accept: "application/json",
    },
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
  ],
});
