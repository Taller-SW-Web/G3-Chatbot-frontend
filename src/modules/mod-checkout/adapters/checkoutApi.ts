"use client";

import { http } from "@/shared/api/http";
import { newIdempotencyKey } from "@/shared/api/idempotency";
import { apiConfig } from "@/shared/config/apiConfig";
import type {
  CheckoutPort,
  CheckoutSesionData,
  CrearCheckoutInput,
  ProcesarPagoInput,
  ResultadoPago,
} from "@/modules/mod-checkout/ports/checkoutPort";

/** Adapter REST de checkout y pago simulado (SPEC-12, SPEC-14). */
export const checkoutApi: CheckoutPort = {
  async iniciarCheckout(input: CrearCheckoutInput, idempotencyKey?: string): Promise<CheckoutSesionData> {
    // The caller keeps the key stable across retries of the same attempt.
    const key = idempotencyKey || newIdempotencyKey();
    const { data } = await http.post("/checkout", input, {
      headers: { "Idempotency-Key": key },
    });
    return data as CheckoutSesionData;
  },
  async obtenerCheckout(checkoutId: string): Promise<CheckoutSesionData> {
    const { data } = await http.get(`/checkout/${encodeURIComponent(checkoutId)}`);
    return data as CheckoutSesionData;
  },
  async pagarCheckout(checkoutId: string, input: ProcesarPagoInput, idempotencyKey?: string): Promise<ResultadoPago> {
    const key = idempotencyKey || newIdempotencyKey();
    const { data } = await http.post(`/checkout/${encodeURIComponent(checkoutId)}/pago`, input, {
      headers: { "Idempotency-Key": key },
      timeout: apiConfig.timeouts.pago,
    });
    return data as ResultadoPago;
  },
  async calificarCompra(pedidoId: string, estrellas: 1 | 2 | 3 | 4 | 5, comentario?: string): Promise<void> {
    await http.post(
      `/pedidos/${encodeURIComponent(pedidoId)}/valoracion-compra`,
      { estrellas, ...(comentario ? { comentario } : {}) },
      { headers: { "Idempotency-Key": newIdempotencyKey() } }
    );
  },
};
