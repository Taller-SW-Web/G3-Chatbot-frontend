import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import sonarjs from "eslint-plugin-sonarjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Reglas tipo Sonar, alineadas con `ruff` (complejidad y errores) en backend.
  // Se activan como warning para no bloquear el legado; subir a error por hito.
  {
    plugins: { sonarjs },
    rules: {
      "sonarjs/no-identical-expressions": "warn",
      "sonarjs/no-all-duplicated-branches": "warn",
      "sonarjs/no-element-overwrite": "warn",
      "sonarjs/no-use-of-empty-return-value": "warn",
      "sonarjs/no-collection-size-mischeck": "warn",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "coverage/**", "next-env.d.ts"]),
]);

export default eslintConfig;
