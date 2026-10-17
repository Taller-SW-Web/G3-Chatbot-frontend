import { defineConfig, devices } from "@playwright/test";

// E2E_BASE_URL apunta al frontend desplegado (Vercel solo publica producción, H3-04).
// Sin ella se levanta Next en local; con API_PROXY_TARGET reenvía /api/* al backend (ADR-0023),
// por ejemplo al de staging.
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  use: { baseURL, trace: "retain-on-failure" },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "pnpm run dev --port 3000",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120_000,
      },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
