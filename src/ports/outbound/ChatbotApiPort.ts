import type { Bloque } from "@/domain/entities/Bloque";
import type { Mensaje } from "@/domain/entities/Mensaje";
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
  enviarMensaje(conversacionId: string, texto: string): Promise<{ mensajeId: string }>;
  cargarHistorial(conversacionId: string, desde?: string): Promise<Mensaje[]>;
  listarConversaciones(pagina?: number): Promise<ConversacionResumen[]>;
  buscarConversaciones(q: string, pagina?: number): Promise<ConversacionResumen[]>;
  agregarAlCarrito(input: { sku: string; cantidad: number }): Promise<{ ok: true }>;
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
  // Resolución de streaming WS ya normalizada a bloques:
  suscribirBloques(onBloque: (b: Bloque) => void): () => void;
}
