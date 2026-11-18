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
      // Baseline medido el 2026-11-10: el mismo conjunto de 561 tests da
      // 82.63 / 78.54 / 79.87 / 83.91 con vitest 4. El denominador de branches
      // crece respecto a vitest 3 (85.67 %), así que ese umbral baja a 74;
      // statements, functions y lines conservan el trinquete anterior.
      thresholds: {
        statements: 80,
        branches: 74,
        functions: 78,
        lines: 80,
      },
    },
  },
});
