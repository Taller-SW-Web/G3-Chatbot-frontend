/**
 * URL base backend + timeouts (catálogo puntual 4s, agregado 12s, pago 10s). ADR-0017, RNFs.
 * Mismo origen por defecto: `next.config.ts` reenvía /api/* al backend (ADR-0023).
 */
export const apiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1",
  timeouts: {
    catalogo: 4000,
    // Catalog lists aggregate taxonomy, details and up to 8s of bounded pricing.
    // Individual detail, stock and REST cart calls retain their existing budgets.
    listadoCatalogo: 12000,
    defecto: 8000,
    pago: 10000,
  },
} as const;
