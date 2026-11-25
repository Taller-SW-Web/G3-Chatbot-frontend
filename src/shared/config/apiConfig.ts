/**
 * URL base backend + timeouts (catálogo puntual 4s, agregado 12s, pago 10s). ADR-0017, RNFs.
 * Mismo origen por defecto: `next.config.ts` reenvía /api/* al backend (ADR-0023).
 */
export const apiConfig = {
  // `||`, no `??`: una variable definida pero vacía debe caer al mismo origen.
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1",
  timeouts: {
    // G6/G5 are remote Render/Azure services: allow cold starts without
    // turning a temporary 5xx into a broken flow in the UI.
    catalogo: 10000,
    // Catalog lists aggregate taxonomy, details and bounded pricing.
    listadoCatalogo: 20000,
    // G5 cold start: Ventas confirmed 60 s for the order history query.
    pedidos: 60000,
    // G5 M2 (returns/claims) can also cold start; same 60 s window.
    postventa: 60000,
    defecto: 20000,
    pago: 30000,
  },
} as const;
