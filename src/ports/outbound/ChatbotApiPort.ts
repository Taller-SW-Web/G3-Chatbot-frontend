import type { Mensaje } from "@/domain/entities/Mensaje";

/**
 * Contrato REST hacia el backend (contratos §1, §2.8).
 * Único punto que los casos de uso conocen. Nunca Axios aquí.
 */
export type ProblemJson = {
  code: string;
  title: string;
  detail?: string;
  disponible?: number;
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

/** Tamaño de página del listado y la búsqueda (backend: CONVERSATIONS_PAGE_SIZE). */
export const CONVERSACIONES_POR_PAGINA = 20;

/** Filtros de `GET /catalogo/productos` (SPEC-06, nombres reales del contrato). */
export type BuscarProductosInput = {
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

export interface ChatbotApiPort {
  login(email: string, password: string): Promise<SessionOpened | MfaChallenge>;
  requestMfaCode(canal: "EMAIL" | "SMS"): Promise<{ ok: true }>;
  verifyMfaCode(code: string): Promise<SessionOpened>;
  refreshSession(): Promise<SessionOpened>;
  logout(): Promise<{ ok: true }>;
  fetchProfile(): Promise<PerfilCliente>;
  crearConversacion(): Promise<{ conversacionId: string }>;
  /** Últimos mensajes de la conversación. El envío va por `ChatStreamPort`. */
  cargarHistorial(conversacionId: string): Promise<Mensaje[]>;
  listarConversaciones(pagina?: number): Promise<ConversacionResumen[]>;
  buscarConversaciones(q: string, pagina?: number): Promise<ConversacionResumen[]>;
  agregarAlCarrito(input: { sku: string; cantidad: number }, conversacionId?: string): Promise<{ ok: true }>;
  /** Carrito con datos reales (SPEC-10, SPEC-11). Sin mocks. Errores por `code`. */
  listarCarrito(conversacionId?: string): Promise<CarritoBackend>;
  actualizarCantidadCarrito(itemId: string, cantidad: number, conversacionId?: string): Promise<CarritoBackend>;
  eliminarLineaCarrito(itemId: string, conversacionId?: string): Promise<{ mensaje: string }>;
  vaciarCarrito(conversacionId?: string): Promise<{ mensaje: string }>;
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
  reenviarConfirmacion(pedidoId: string): Promise<{ ok: true }>;
}
