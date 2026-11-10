import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  test: {
    environment: "node",
    setupFiles: ["./tests/unit/setup.ts"],
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.d.ts"],
      // Baseline medido el 2026-11-09 tras cubrir AppShell, AuthModal, HomePage,
      // Sidebar y useChat (57.6 % → 73.7 %). Es un piso que sube por hito, no un
      // techo: se deja ~5 puntos de margen sobre lo medido.
      thresholds: {
        statements: 68,
        branches: 80,
        functions: 74,
        lines: 68,
      },
    },
  },
});
