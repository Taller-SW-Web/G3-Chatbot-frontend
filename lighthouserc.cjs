module.exports = {
  ci: {
    collect: {
      startServerCommand: "node scripts/lighthouse/serve.mjs",
      startServerReadyPattern: "ready on|started server on|Listening on|Local:",
      startServerReadyTimeout: 60000,
      url: [
        "http://localhost:3000/",
        "http://localhost:3000/carrito",
        "http://localhost:3000/buscar",
        "http://localhost:3000/privacidad",
      ],
      // 3 corridas con mediana para estabilidad y evitar falsos positivos por varianza (H5-P4)
      numberOfRuns: 3,
      settings: {
        // Enfoque Mobile-First con throttling aplicado (CPU 4x y red 4G reales del emulador).
        chromeFlags: "--no-sandbox --disable-gpu --headless",
        throttlingMethod: "devtools",
      },
    },
    assert: {
      assertMatrix: [
      {
        // El objetivo de producto (LCP <= 2500 ms) ya se cumple en las
        // pantallas que renderizan contenido en servidor. `/carrito` queda
        // con el techo de CI 4800 ms hasta que su estado vacío no dependa de
        // la hidratación (issue #164).
        matchingUrlPattern: "^http://localhost:3000/(buscar|privacidad)?$",
        assertions: {
          "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        },
      },
      {
        matchingUrlPattern: ".*",
        assertions: {
        // Presupuesto de Accesibilidad (mínimo 90% automatizado)
        "categories:accessibility": ["error", { minScore: 0.9 }],
        // Presupuesto de Rendimiento general (mínimo 70%)
        "categories:performance": ["warn", { minScore: 0.7 }],
        "categories:best-practices": ["warn", { minScore: 0.8 }],
        "categories:seo": ["warn", { minScore: 0.8 }],

        // Presupuesto Core Web Vitals (H5-P4 - Mobile First)
        // Objetivo del proyecto: LCP <= 2500 ms y TBT <= 200 ms (ver docs/rendimiento-lighthouse.md).
        // Excepción técnica en CI aprobada por @Ankarmin el 2026-11-27 (Issue #164): `/carrito`
        // renderiza su estado vacío tras la hidratación y mide ~3971 ms con CPU 4x; el resto de
        // URLs cumple 2500 ms (assertMatrix). El techo global de 4800 ms queda para esa excepción.
        "largest-contentful-paint": ["error", { maxNumericValue: 4800 }],
        // CLS <= 0.10 (umbral estricto "Good" de Core Web Vitals)
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        // TBT (proxy en laboratorio de interactividad / INP, techo acotado a 350 ms en CI)
        "total-blocking-time": ["error", { maxNumericValue: 350 }],
        "max-potential-fid": ["warn", { maxNumericValue: 500 }],
        "interactive": ["warn", { maxNumericValue: 4800 }],

        // Presupuesto de Peso de Recursos bloqueantes (H5-P4)
        "resource-summary:script:size": ["error", { maxNumericValue: 600000 }],
        "resource-summary:total:size": ["error", { maxNumericValue: 1800000 }],
        },
      },
    ],
    },
    upload: {
      target: "filesystem",
      outputDir: "./.lighthouseci",
      reportFilenamePattern: "%%PATHNAME%%-%%DATETIME%%.report.%%EXTENSION%%",
    },
  },
};
