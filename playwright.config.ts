import { defineConfig, devices } from "@playwright/test";

// E2E_BASE_URL apunta a un entorno desplegado (staging o vista previa de Vercel).
// Sin ella se levanta Next en local; con API_PROXY_TARGET reenvía /api/* al backend (ADR-0023).
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
