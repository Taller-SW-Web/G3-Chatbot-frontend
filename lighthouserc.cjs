module.exports = {
  ci: {
    collect: {
      startServerCommand: "pnpm start",
      startServerReadyPattern: "ready on|started server on|Listening on|Local:",
      startServerReadyTimeout: 45000,
      url: [
        "http://localhost:3000/",
        "http://localhost:3000/carrito",
        "http://localhost:3000/pedidos",
        "http://localhost:3000/cuenta",
      ],
      numberOfRuns: 1,
      settings: {
        preset: "desktop",
        chromeFlags: "--no-sandbox --disable-gpu --headless",
      },
    },
    assert: {
      assertions: {
        // Presupuesto de Accesibilidad (mínimo 90%)
        "categories:accessibility": ["error", { minScore: 0.9 }],
        // Presupuesto de Rendimiento general (mínimo 70%)
        "categories:performance": ["warn", { minScore: 0.7 }],
        "categories:best-practices": ["warn", { minScore: 0.8 }],
        "categories:seo": ["warn", { minScore: 0.8 }],

        // Presupuesto Core Web Vitals (H5-P4)
        "largest-contentful-paint": ["error", { maxNumericValue: 3000 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        "total-blocking-time": ["error", { maxNumericValue: 500 }],
        "max-potential-fid": ["warn", { maxNumericValue: 250 }],
        "interactive": ["warn", { maxNumericValue: 3800 }],

        // Presupuesto de Peso de Recursos (H5-P4)
        "resource-summary:script:size": ["warn", { maxNumericValue: 600000 }],
        "resource-summary:total:size": ["warn", { maxNumericValue: 1800000 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "./.lighthouseci",
      reportFilenamePattern: "%%PATHNAME%%-%%DATETIME%%.report.%%EXTENSION%%",
    },
  },
};
