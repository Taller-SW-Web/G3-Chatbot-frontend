import type { NextConfig } from "next";
import { resolveApiProxyTarget } from "./src/shared/config/apiProxyTarget";

// ADR-0023: el navegador llama a /api/* en el propio origen y Next.js reenvía al backend.
// Variable de servidor por entorno (staging: https://g3-chatbot-backend-staging.up.railway.app).
// En Vercel falla el build si falta (ver resolveApiProxyTarget).
const apiProxyTarget = resolveApiProxyTarget(process.env);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    if (!apiProxyTarget) return [];
    return [{ source: "/api/:path*", destination: `${apiProxyTarget}/api/:path*` }];
  },
};

export default nextConfig;
