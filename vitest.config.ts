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
      // Baseline measured on 2026-11-07. A floor that ratchets per milestone,
      // not a target: raise it with the team instead of jumping to a global 90 %.
      thresholds: {
        statements: 55,
        branches: 78,
        functions: 70,
        lines: 55,
      },
    },
  },
});
