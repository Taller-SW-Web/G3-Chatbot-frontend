#!/usr/bin/env node
/**
 * Arranca el mock del backend y `next start` para Lighthouse.
 *
 * `API_PROXY_TARGET` se fija aquí para que el runtime del proxy `/api/*` apunte
 * al mock. El build de CI también la define, porque Next resuelve los rewrites
 * en tiempo de build.
 */
import { spawn } from "node:child_process";
import { createMockApiServer, MOCK_API_PORT } from "./mock-api.mjs";

const server = createMockApiServer();
server.listen(MOCK_API_PORT, "127.0.0.1");

const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const child = spawn(pnpm, ["start"], {
  stdio: "inherit",
  env: {
    ...process.env,
    API_PROXY_TARGET: `http://127.0.0.1:${MOCK_API_PORT}`,
    NEXT_TELEMETRY_DISABLED: "1",
  },
  shell: process.platform === "win32",
  detached: process.platform !== "win32",
});

let stopping = false;

function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;

  if (child.pid && !child.killed) {
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
        stdio: "ignore",
      });
    } else {
      // El proceso se lanzó en su propio grupo: mata también a `next start`.
      try {
        process.kill(-child.pid, "SIGTERM");
      } catch {
        child.kill("SIGTERM");
      }
    }
  }

  server.close(() => process.exit(exitCode));
}

process.on("SIGTERM", () => stop(0));
process.on("SIGINT", () => stop(0));

child.on("exit", (code) => {
  if (!stopping) server.close(() => process.exit(code ?? 0));
});
