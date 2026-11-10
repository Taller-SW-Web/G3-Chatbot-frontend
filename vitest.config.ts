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
      // Baseline medido el 2026-11-10 tras cubrir las pantallas y modales que
      // quedaban a 0 % (73.7 % → 85.1 %). Es un piso que sube por hito, no un
      // techo: se deja ~5 puntos de margen sobre lo medido.
      thresholds: {
        statements: 80,
        branches: 82,
        functions: 78,
        lines: 80,
      },
    },
  },
});
