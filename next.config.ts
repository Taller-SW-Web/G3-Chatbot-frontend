import type { NextConfig } from "next";

// ADR-0023: el navegador llama a /api/* en el propio origen y Next.js reenvía al backend.
// Variable de servidor por entorno (staging: https://g3-chatbot-backend-staging.up.railway.app).
const apiProxyTarget = process.env.API_PROXY_TARGET;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    if (!apiProxyTarget) return [];
    return [{ source: "/api/:path*", destination: `${apiProxyTarget}/api/:path*` }];
  },
};

export default nextConfig;
