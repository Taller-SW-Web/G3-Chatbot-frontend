import { defineConfig, devices } from "@playwright/test";

// E2E_BASE_URL apunta a un frontend ya desplegado (sin levantar Next en local).
// Sin ella se levanta Next en local; con API_PROXY_TARGET reenvía /api/* al backend (ADR-0023),
// por ejemplo al backend levantado en el mismo job de CI con MODULES_MODE=fake.
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests/e2e",
  // `chat.real.spec.ts` depende del LLM real: solo corre en el workflow nocturno
  // (E2E_REAL=1) contra el entorno desplegado, nunca en el gate del PR.
  testIgnore: process.env.E2E_REAL ? [] : ["**/chat.real.spec.ts"],
  // En CI nadie debe dejar un `test.only` que silencie el resto de la suite.
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    // Artefactos solo cuando algo falla: el run normal no pesa.
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "pnpm run dev --port 3000",
        url: "http://localhost:3000",
        reuseExistingServer: !isCI,
        timeout: 120_000,
      },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
