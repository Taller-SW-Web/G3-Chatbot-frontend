"use client";

import { http } from "@/shared/api/http";
import type {
  PaginaPedidos,
  PedidoDetalle,
  PedidosPort,
  ReenvioConfirmacion,
  SeguimientoPedido,
} from "@/modules/mod-orders/ports/pedidosPort";

/** Adapter REST de pedidos, seguimiento y reenvío de confirmación (SPEC-15..18, SPEC-24). */
export const pedidosApi: PedidosPort = {
  async listarPedidos(input = {}): Promise<PaginaPedidos> {
    const { data } = await http.get("/pedidos", {
      params: {
        page: input.page ?? 1,
        pageSize: input.pageSize ?? 10,
        ...(input.estado ? { estado: input.estado } : {}),
      },
    });
    return data as PaginaPedidos;
  },
  async obtenerPedido(pedidoId: string): Promise<PedidoDetalle> {
    const { data } = await http.get(`/pedidos/${encodeURIComponent(pedidoId)}`);
    return data as PedidoDetalle;
  },
  async obtenerSeguimientoPedido(pedidoId: string): Promise<SeguimientoPedido> {
    const { data } = await http.get(`/pedidos/${encodeURIComponent(pedidoId)}/seguimiento`);
    return data as SeguimientoPedido;
  },
  async calificarPedido(pedidoId: string, puntuacion: 1 | 3 | 5, comentario?: string): Promise<void> {
    await http.post(`/pedidos/${encodeURIComponent(pedidoId)}/csat`, {
      puntuacion,
      ...(comentario ? { comentario } : {}),
    });
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
