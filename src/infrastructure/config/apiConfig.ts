/** URL base backend + timeouts (catálogo 4s, pago 1s). ADR-0017, RNFs */
export const apiConfig = {
  baseUrl:
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api",
  timeouts: {
    catalogo: 4000,
    defecto: 8000,
    pago: 1000,
  },
  pollingMs: 2000,
  wsReintentos: 2,
} as const;
