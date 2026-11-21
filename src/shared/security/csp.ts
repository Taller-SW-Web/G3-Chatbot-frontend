/** CSP estricta anti-XSS (token en LocalStorage R7). */
export const cspDirectives = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self' http://localhost:8080 https://*.api",
  "frame-ancestors 'none'",
].join("; ");
