import type { Mensaje } from "@/domain/entities/Mensaje";
import type { Bloque } from "@/domain/entities/Bloque";
import type { PoliticaContrasena } from "@/domain/utils/passwordPolicy";

export type { PoliticaContrasena };

/**
 * Contrato REST hacia el backend (contratos §1, §2.8).
 * Único punto que los casos de uso conocen. Nunca Axios aquí.
 */
export type ProblemJson = {
  code: string;
  title: string;
  detail?: string;
  disponible?: number;
  /** 409 VARIANTE_REQUERIDA: atributos que faltan elegir. */
  faltantes?: string[];
  product_id?: string;
};

/** Tramo de texto de un resultado de búsqueda; `coincide` marca el término encontrado. */
export type SegmentoResaltado = {
  texto: string;
  coincide: boolean;
};

/** Fila de la barra lateral (GET /chat/conversaciones y /buscar, SPEC-05 Req. 1). */
export type ConversacionResumen = {
  id: string;
  titulo: string;
  preview: string;
  ultimoMensajeEn: string;
  /** Solo en la búsqueda: título y fragmento del mensaje con la coincidencia resaltada. */
  resaltado?: {
    titulo: SegmentoResaltado[];
    fragmento: SegmentoResaltado[] | null;
  };
};

/** Usuario que viaja en el cuerpo de `/sesion/login`, `/refresh` y `/mfa/verificar`. */
export type UsuarioSesion = {
  id?: string;
  nombreCompleto?: string;
  correo?: string;
};

export type SessionOpened = {
  accessToken: string;
  expiresIn: number;
  usuario: UsuarioSesion;
};

/** Respuesta de `GET /sesion/perfil`: Seguridad `/auth/me` + `celularVerificado` y documento enmascarado. */
export type PerfilCliente = UsuarioSesion & {
  celular?: string;
  celularVerificado: boolean;
  ultimoDocumento: { tipo?: string; numeroEnmascarado: string } | null;
};

export type MfaChallenge = {
  mfaRequerido: true;
  canal: "EMAIL" | "SMS";
};

/** Datos del formulario de registro (SPEC-01 Req. 1); el adapter los mapea al contrato del BFF. */
export type RegistroClienteInput = {
  nombres: string;
  apellidos: string;
  correo: string;
  celular: string;
  contrasena: string;
  aceptaTerminos: true;
};

/** Respuesta de `POST /sesion/registro`: la cuenta queda PENDIENTE_VERIFICACION, sin sesión. */
export type RegistroResultado = {
  estado: string;
  correoEnmascarado: string;
};

/** Tamaño de página del listado y la búsqueda (backend: CONVERSATIONS_PAGE_SIZE). */
export const CONVERSACIONES_POR_PAGINA = 20;

/** Filtros de `GET /catalogo/productos` (SPEC-06, nombres reales del contrato). */
export type BuscarProductosInput = {
  soloOfertas?: boolean;
  q?: string;
  categoria?: string;
  marca?: string;
  precioMin?: number;
  precioMax?: number;
  orden?: string;
  pagina?: number;
  tamanio?: number;
};

/** Página de catálogo (`items`, `total`; el mensaje trae aclaraciones). */
export type PaginaCatalogo = {
  items: unknown[];
  total: number;
  mensaje?: string;
};

/** Disponibilidad puntual (`GET /catalogo/disponibilidad`, SPEC-10). */
export type DisponibilidadPuntual = {
  sku: string;
  status: string;
  veredicto?: string | null;
};

export type AccionChat = {
  tipo: string;
  payload: Record<string, unknown>;
};

export type ResultadoAccionChat = {
  texto: string;
  bloques: Bloque[];
};

/** Línea del carrito tal como la expone `GET /carrito` (SPEC-11, contratos §2.4). */
export type LineaCarritoBackend = {
  item_id: string;
  sku: string;
  nombre: string;
  variante?: string | null;
  cantidad: number;
  precio: number;
  disponible: boolean;
  imagen?: string | null;
  nota?: string | null;
};

/** Carrito con totales recalculados (SPEC-11 Req. 3). Precios desde herramientas. */
export type CarritoBackend = {
  lineas: LineaCarritoBackend[];
  subtotal: number;
  descuentos: { nombre: string; monto: number }[];
  costoEnvio: number | null;
  envio?: string | null;
  total: number;
  avisos: string[];
  promociones_ok?: boolean;
};

/** Cupón aplicado al carrito (`POST /carrito/cupon`, SPEC-13). */
export type CuponAplicado = {
  codigo: string;
  descuento: number;
  moneda: string;
  promocionId?: string | null;
};

/** Respuesta de aplicar/quitar cupón: mensaje, cupón y carrito recalculado. */
export type ResultadoCupon = {
  mensaje: string;
  cupon: CuponAplicado | null;
  carrito: CarritoBackend;
};

/** Entrada de `POST /carrito/items`. `product_id`/`talla`/`color` completan la línea. */
export type AgregarAlCarritoInput = {
  sku: string;
  cantidad: number;
  product_id?: string;
  talla?: string;
  color?: string;
};

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

export type PedidoDetalle = PedidoResumen & {
  items: PedidoLinea[];
  envio: Record<string, unknown> | null;
  historial: { estado: string; etiqueta: string; fecha: string; completado: boolean }[];
  seguimientoDisponible?: boolean;
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

/** Body of `POST /checkout`: the server computes lines and amounts (contratos-integracion §2.8). */
export type CrearCheckoutInput = {
  cartId?: string;
  direccion?: Record<string, unknown>;
  contacto?: Record<string, unknown>;
};

export type CheckoutSesionData = {
  id: string;
  cartId: string;
  orderId?: string;
  status: string;
  total: number;
  expiresAt: string;
  intentosRestantes: number;
  summary: Record<string, unknown>;
};

export type ProcesarPagoInput = {
  numeroTarjeta: string;
  titular: string;
  vencimiento: string;
  cvv: string;
};

export type ResultadoPago = {
  id: string;
  checkoutId: string;
  orderId?: string;
  resultado: string;
  marca: string;
  ultimos4: string;
  monto: number;
  idTransaccion?: string;
  correoEnmascarado?: string;
  mensaje?: string;
};

/** Entrada de `POST /envio/cotizar` (SPEC-12 Req. 2 y 4). */
export type CotizarEnvioInput = {
  destinatario: string;
  direccion: string;
  distrito: string;
  referencia?: string;
};

/** Respuesta de `POST /envio/cotizar`: cobertura, costo y plazo reales. */
export type CotizacionEnvio = {
  coberturaDisponible: boolean;
  costoEnvio: number;
  moneda: string;
  plazoEstimadoDias: number;
  fechaEstimadaEntrega?: string | null;
  nombreZona?: string | null;
  modalidad?: string;
  distrito: string;
};

export interface ChatbotApiPort {
  login(email: string, password: string): Promise<SessionOpened | MfaChallenge>;
  /** SPEC-01: crea la cuenta y devuelve el correo enmascarado; nunca abre sesión. */
  registrar(input: RegistroClienteInput): Promise<RegistroResultado>;
  /** SPEC-01 Req. 2: política de contraseña cacheada durante la sesión del navegador. */
  obtenerPoliticaContrasena(): Promise<PoliticaContrasena>;
  /** SPEC-02 Req. 1: canjea el enlace de verificación (204) o falla con 410. */
  verificarCorreo(token: string): Promise<void>;
  /** SPEC-02 Req. 2: reenvío neutro del enlace (202). */
  reenviarVerificacion(correo: string): Promise<{ ok: true }>;
  requestMfaCode(canal: "EMAIL" | "SMS"): Promise<{ ok: true }>;
  verifyMfaCode(code: string): Promise<SessionOpened>;
  refreshSession(): Promise<SessionOpened>;
  logout(): Promise<{ ok: true }>;
  fetchProfile(): Promise<PerfilCliente>;
  crearConversacion(): Promise<{ conversacionId: string }>;
  /** Últimos mensajes de la conversación. El envío va por `ChatStreamPort`. */
  cargarHistorial(conversacionId: string): Promise<Mensaje[]>;
  ejecutarAccion(
    conversacionId: string,
    accion: AccionChat
  ): Promise<ResultadoAccionChat>;
  listarConversaciones(pagina?: number): Promise<ConversacionResumen[]>;
  buscarConversaciones(q: string, pagina?: number): Promise<ConversacionResumen[]>;
  agregarAlCarrito(input: AgregarAlCarritoInput, conversacionId?: string): Promise<{ ok: true; carrito?: CarritoBackend }>;
  /** Carrito con datos reales (SPEC-10, SPEC-11). Sin mocks. Errores por `code`. */
  listarCarrito(conversacionId?: string): Promise<CarritoBackend>;
  actualizarCantidadCarrito(itemId: string, cantidad: number, conversacionId?: string): Promise<CarritoBackend>;
  eliminarLineaCarrito(itemId: string, conversacionId?: string): Promise<{ mensaje: string }>;
  vaciarCarrito(conversacionId?: string): Promise<{ mensaje: string }>;
  /** Cotiza el envío del carrito a un distrito (SPEC-12). Requiere sesión. */
  cotizarEnvio(input: CotizarEnvioInput): Promise<CotizacionEnvio>;
  /** SPEC-13: valida y aplica el cupón (requiere sesión); no lo consume. */
  aplicarCupon(codigo: string, confirmarReemplazo?: boolean): Promise<ResultadoCupon>;
  /** SPEC-13: quita el cupón y recalcula los totales. */
  quitarCupon(): Promise<ResultadoCupon>;
  /** Catálogo con datos reales (SPEC-06, SPEC-09, SPEC-10). Sin mocks. */
  buscarProductos(input: BuscarProductosInput): Promise<PaginaCatalogo>;
  verDetalleProducto(productId: string): Promise<unknown>;
  consultarDisponibilidad(sku: string, cantidad?: number): Promise<DisponibilidadPuntual[]>;
  validarContactoCelular(codigo: string): Promise<{ verificado: boolean }>;
  cotizar(): Promise<{ total: number }>;
  crearCheckout(input: {
    nombre: string;
    direccion: string;
    distrito: string;
    referencia?: string;
    docTipo: string;
    docNum: string;
    tarjetaLast4: string;
  }): Promise<{ pedidoId: string }>;
  /** SPEC-17: pedidos del cliente autenticado. */
  listarPedidos(input?: { page?: number; pageSize?: number; estado?: string }): Promise<PaginaPedidos>;
  /** SPEC-17: detalle, estado e historial de un pedido propio. */
  obtenerPedido(pedidoId: string): Promise<PedidoDetalle>;
  /** SPEC-18: hitos del despacho de un pedido propio. */
  obtenerSeguimientoPedido(pedidoId: string): Promise<SeguimientoPedido>;
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
  /** SPEC-16 Req. 3: reenvía el correo de confirmación (máx. 2). Propaga 429 LIMITE_REENVIOS_EXCEDIDO. */
  reenviarConfirmacion(pedidoId: string, idempotencyKey: string): Promise<ReenvioConfirmacion>;
  /** SPEC-14: Inicia sesión de checkout en backend con vigencia de 15 min. */
  iniciarCheckout(input: CrearCheckoutInput, idempotencyKey?: string): Promise<CheckoutSesionData>;
  /** SPEC-14: Consulta estado del checkout e intentos restantes. */
  obtenerCheckout(checkoutId: string): Promise<CheckoutSesionData>;
  /** SPEC-14: Simula el pago con tarjeta determinista contra el simulador de backend. */
  pagarCheckout(checkoutId: string, input: ProcesarPagoInput, idempotencyKey?: string): Promise<ResultadoPago>;
}
