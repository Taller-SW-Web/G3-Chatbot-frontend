const isWindows = process.platform === "win32";

module.exports = {
  ci: {
    collect: {
      startServerCommand: isWindows ? "corepack pnpm start" : "pnpm start",
      startServerReadyPattern: "ready on|started server on|Listening on|Local:",
      startServerReadyTimeout: 45000,
      url: [
        "http://localhost:3000/",
        "http://localhost:3000/carrito",
        "http://localhost:3000/pedidos",
        "http://localhost:3000/cuenta",
      ],
      // 3 corridas con mediana para estabilidad y evitar falsos positivos por varianza (H5-P4)
      numberOfRuns: 3,
      settings: {
        // Enfoque Mobile-First (default de Lighthouse: emulación móvil, CPU throttling 4x y red 4G)
        chromeFlags: "--no-sandbox --disable-gpu --headless",
      },
    },
    assert: {
      assertions: {
        // Presupuesto de Accesibilidad (mínimo 90% automatizado)
        "categories:accessibility": ["error", { minScore: 0.9 }],
        // Presupuesto de Rendimiento general (mínimo 70%)
        "categories:performance": ["warn", { minScore: 0.7 }],
        "categories:best-practices": ["warn", { minScore: 0.8 }],
        "categories:seo": ["warn", { minScore: 0.8 }],

        // Presupuesto Core Web Vitals (H5-P4 - Mobile First)
        // LCP <= 2500 ms (umbral estricto "Good" de Core Web Vitals)
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        // CLS <= 0.10 (umbral estricto "Good" de Core Web Vitals)
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        // TBT <= 200 ms (proxy estricto en laboratorio de interactividad / INP)
        "total-blocking-time": ["error", { maxNumericValue: 200 }],
        "max-potential-fid": ["warn", { maxNumericValue: 250 }],
        "interactive": ["warn", { maxNumericValue: 3800 }],

        // Presupuesto de Peso de Recursos bloqueantes (H5-P4)
        "resource-summary:script:size": ["error", { maxNumericValue: 600000 }],
        "resource-summary:total:size": ["error", { maxNumericValue: 1800000 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "./.lighthouseci",
      reportFilenamePattern: "%%PATHNAME%%-%%DATETIME%%.report.%%EXTENSION%%",
    },
  },
};
