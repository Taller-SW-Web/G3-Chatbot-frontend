/** Contrato REST de pedidos, seguimiento y reenvío de confirmación (SPEC-15..18). */

/** 202 de `POST /pedidos/{pedidoId}/reenviar-confirmacion` (contratos-integracion §2.5.2). */
export type ReenvioConfirmacion = {
  ok: boolean;
  pedidoId: string;
  reenviosRestantes: number;
  correoEnmascarado: string;
};

/** Fila de pedido (`GET /pedidos` y `GET /pedidos/me`, SPEC-17). */
export type PedidoResumen = {
  pedidoId: string;
  canal: string;
  estado: string;
  estadoEtiqueta: string;
  total: number;
  moneda: string;
  fechaCreacion: string;
};

export type PedidoLinea = {
  productoId: string;
  sku: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
};

/** Snapshot del envío en el detalle del pedido (contratos-integracion §2.5.2). */
export type PedidoEnvio = {
  destinatario?: string;
  distrito?: string;
  direccion?: string;
  costo?: number;
  plazoEstimadoDias?: number;
};

export type PedidoDetalle = PedidoResumen & {
  items: PedidoLinea[];
  envio: PedidoEnvio | null;
  historial: { estado: string; etiqueta: string; fecha: string; completado: boolean; motivo?: string | null }[];
  seguimientoDisponible?: boolean;
  motivoAnulacion?: string | null;
  reembolso?: string | null;
  /** SPEC-24: el cliente ya calificó la entrega; el slot de CSAT no debe mostrarse. */
  csatEnviado?: boolean;
};

/** Seguimiento del despacho (`GET /pedidos/{id}/seguimiento`, SPEC-18). */
export type SeguimientoPedido = {
  pedidoId: string;
  estado: string;
  estadoEtiqueta: string;
  fechaProgramada?: string | null;
  distrito?: string | null;
  hitos: { titulo: string; fecha: string; completado: boolean }[];
  recibidoPor?: string | null;
  detalleDisponible: boolean;
  mensaje?: string | null;
};

export type PaginaPedidos = {
  items: PedidoResumen[];
  total: number;
  page: number;
  pageSize: number;
};

export interface PedidosPort {
  /** SPEC-17: pedidos del cliente autenticado. */
  listarPedidos(input?: { page?: number; pageSize?: number; estado?: string }): Promise<PaginaPedidos>;
  /** SPEC-17: detalle, estado e historial de un pedido propio. */
  obtenerPedido(pedidoId: string): Promise<PedidoDetalle>;
  /** SPEC-18: hitos del despacho de un pedido propio. */
  obtenerSeguimientoPedido(pedidoId: string): Promise<SeguimientoPedido>;
  /** SPEC-16 Req. 3: reenvía el correo de confirmación (máx. 2). Propaga 429 LIMITE_REENVIOS_EXCEDIDO. */
  reenviarConfirmacion(pedidoId: string, idempotencyKey: string): Promise<ReenvioConfirmacion>;
}
