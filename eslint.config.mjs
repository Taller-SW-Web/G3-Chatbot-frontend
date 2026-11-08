import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import sonarjs from "eslint-plugin-sonarjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Reglas tipo Sonar, alineadas con `ruff` + bugbear (B904/B905/B017) en backend.
  // En `error`: el legado no las viola hoy, así que no bloquean nada existente.
  {
    plugins: { sonarjs },
    rules: {
      "sonarjs/no-identical-expressions": "error",
      "sonarjs/no-all-duplicated-branches": "error",
      "sonarjs/no-element-overwrite": "error",
      "sonarjs/no-use-of-empty-return-value": "error",
      "sonarjs/no-collection-size-mischeck": "error",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "coverage/**", "next-env.d.ts"]),
]);

export default eslintConfig;
