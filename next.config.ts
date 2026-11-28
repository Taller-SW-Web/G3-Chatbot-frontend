import type { NextConfig } from "next";
import { resolveApiProxyTarget } from "./src/shared/config/apiProxyTarget";
import { buildCsp, CSP_REPORT_ENDPOINTS } from "./src/shared/security/csp";

// ADR-0023 & ADR-0031: el navegador llama a /api/* en el propio origen y Next.js reenvía al API Gateway (Kong OSS).
// Variable de servidor por entorno (Preview y Production: https://<gateway>.up.railway.app).
// En Vercel falla el build si falta (ver resolveApiProxyTarget).
const apiProxyTarget = resolveApiProxyTarget(process.env);

const isDev = process.env.NODE_ENV === "development";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // Reporting API solo se procesa sobre HTTPS; en dev queda `report-uri`.
  ...(isDev ? [] : [{ key: "Reporting-Endpoints", value: CSP_REPORT_ENDPOINTS }]),
  // Report-Only primero: la CSP se observa en producción antes de volverla bloqueante.
  {
    key: "Content-Security-Policy-Report-Only",
    value: buildCsp({ isDev, apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL }),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async rewrites() {
    if (!apiProxyTarget) return [];
    return [{ source: "/api/:path*", destination: `${apiProxyTarget}/api/:path*` }];
  },
};

export default nextConfig;
