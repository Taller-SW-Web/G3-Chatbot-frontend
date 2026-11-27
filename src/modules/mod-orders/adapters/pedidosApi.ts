"use client";

import { http } from "@/shared/api/http";
import { apiConfig } from "@/shared/config/apiConfig";
import type {
  PaginaPedidos,
  PedidoDetalle,
  PedidosPort,
  ReenvioConfirmacion,
  SeguimientoPedido,
} from "@/modules/mod-orders/ports/pedidosPort";

/** Adapter REST de pedidos, seguimiento y reenvío de confirmación (SPEC-15..18). */
export const pedidosApi: PedidosPort = {
  async listarPedidos(input = {}): Promise<PaginaPedidos> {
    const { data } = await http.get("/pedidos", {
      params: {
        page: input.page ?? 1,
        pageSize: input.pageSize ?? 10,
        ...(input.estado ? { estado: input.estado } : {}),
      },
      timeout: apiConfig.timeouts.pedidos,
    });
    return data as PaginaPedidos;
  },
  async obtenerPedido(pedidoId: string): Promise<PedidoDetalle> {
    const { data } = await http.get(`/pedidos/${encodeURIComponent(pedidoId)}`, {
      timeout: apiConfig.timeouts.pedidos,
    });
    return data as PedidoDetalle;
  },
  async obtenerSeguimientoPedido(pedidoId: string): Promise<SeguimientoPedido> {
    const { data } = await http.get(`/pedidos/${encodeURIComponent(pedidoId)}/seguimiento`, {
      timeout: apiConfig.timeouts.pedidos,
    });
    return data as SeguimientoPedido;
  },
  // Real backend, no fallback: a fake "ok" would tell the customer the e-mail was resent.
  async reenviarConfirmacion(pedidoId, idempotencyKey) {
    const { data } = await http.post(
      `/pedidos/${encodeURIComponent(pedidoId)}/reenviar-confirmacion`,
      null,
      { headers: { "Idempotency-Key": idempotencyKey } }
    );
    return data as ReenvioConfirmacion;
  },
};
