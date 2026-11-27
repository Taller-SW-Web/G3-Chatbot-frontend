/** Contrato REST de postventa: evidencias, devoluciones, reclamos y CSAT (SPEC-19..22, SPEC-24). */

/** Evidencia devuelta por `POST /evidencias` (proxy a G5 F3 §2.1). */
export type EvidenciaSubida = {
  tipo: "IMAGEN" | "DOCUMENTO";
  url: string;
  nombreArchivoOriginal: string;
  tamanioBytes: number;
  fechaSubida: string;
};

export type DevolucionItemInput = {
  productoId: string;
  cantidad: number;
};

export type DevolucionEvidenciaInput = {
  tipo: "IMAGEN" | "DOCUMENTO";
  url: string;
};

export type CrearDevolucionInput = {
  pedidoId: string;
  tipo: "CAMBIO" | "DEVOLUCION_DINERO";
  motivo: string;
  descripcion?: string;
  items: DevolucionItemInput[];
  evidencias?: DevolucionEvidenciaInput[];
  /** SPEC-21: variante elegida en caso de CAMBIO (talla, color, etc.). */
  varianteDeseada?: string;
  /** Reenvía pese a un `409 DEVOLUCION_DUPLICADA` (acción "Registrar igual"). */
  forzar?: boolean;
};

export type DevolucionResumen = {
  devolucionId: string;
  pedidoId: string;
  tipo: string;
  estado: string;
  motivo: string;
  estadoReembolso?: string | null;
  fechaRegistro: string;
};

export type DevolucionDetalle = DevolucionResumen & {
  descripcion?: string | null;
  items: DevolucionItemInput[];
  resolucion?: Record<string, unknown> | null;
  evidencias: DevolucionEvidenciaInput[];
  historial: Record<string, unknown>[];
  recepciones: Record<string, unknown>[];
};

export type PaginaDevoluciones = {
  items: DevolucionResumen[];
  total: number;
  page: number;
  pageSize: number;
};

export type ReclamoConsumidorInput = {
  nombreCompleto: string;
  documento: string;
  email: string;
  telefono: string;
};

export type CrearReclamoInput = {
  pedidoId?: string;
  tipo: "RECLAMO" | "QUEJA";
  motivo: string;
  detalle: string;
  consumidor: ReclamoConsumidorInput;
  solucionEsperada?: string;
  /** Reenvía pese a un `409 RECLAMO_DUPLICADO` (acción "Registrar igual"). */
  forzar?: boolean;
};

export type ReclamoResumen = {
  reclamoId: string;
  codigoSeguimiento: string;
  pedidoId?: string | null;
  tipo: string;
  motivo: string;
  estado: string;
  fechaRegistro: string;
  fechaLimiteSLA?: string | null;
  estadoSla?: string | null;
  diasHabilesRestantes?: number | null;
};

export type ReclamoDetalle = ReclamoResumen & {
  canal: string;
  detalle: string;
  plazoDiasHabiles: number;
  fechaLimiteSLA: string;
  fechaAtencion?: string | null;
  respuestaVisibleCliente?: string | null;
  slaCumplido?: boolean | null;
};

export type PaginaReclamos = {
  items: ReclamoResumen[];
  total: number;
  page: number;
  pageSize: number;
};

export interface PostventaPort {
  /** SPEC-21: sube evidencia a G5 y devuelve la URL que se usa en la devolución. */
  subirEvidencia(file: File, conversacionId?: string): Promise<EvidenciaSubida>;
  /** SPEC-21: registra la solicitud de cambio/devolución. */
  crearDevolucion(input: CrearDevolucionInput, idempotencyKey?: string): Promise<DevolucionDetalle>;
  /** SPEC-22: devoluciones del cliente autenticado. */
  listarDevoluciones(input?: { page?: number; pageSize?: number; estado?: string; tipo?: string }): Promise<PaginaDevoluciones>;
  /** SPEC-22: detalle de una devolución propia. */
  obtenerDevolucion(devolucionId: string): Promise<DevolucionDetalle>;
  /** SPEC-19: registra un reclamo del Libro de Reclamaciones. */
  crearReclamo(input: CrearReclamoInput, idempotencyKey?: string): Promise<ReclamoDetalle>;
  /** SPEC-20: reclamos del cliente autenticado. */
  listarReclamos(input?: { page?: number; pageSize?: number; estado?: string }): Promise<PaginaReclamos>;
  /** SPEC-20: detalle de un reclamo propio por código de seguimiento. */
  obtenerReclamo(codigoSeguimiento: string): Promise<ReclamoDetalle>;
  /** SPEC-24: califica la entrega de un pedido ENTREGADO. */
  calificarPedido(pedidoId: string, puntuacion: 1 | 3 | 5, comentario?: string): Promise<void>;
}
