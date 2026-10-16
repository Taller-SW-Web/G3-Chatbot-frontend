import type { Bloque } from "@/domain/entities/Bloque";
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

/** Tamaño de página del listado y la búsqueda (backend: CONVERSATIONS_PAGE_SIZE). */
export const CONVERSACIONES_POR_PAGINA = 20;

export interface ChatbotApiPort {
  crearConversacion(): Promise<{ conversacionId: string }>;
  enviarMensaje(conversacionId: string, texto: string): Promise<{ mensajeId: string }>;
  cargarHistorial(conversacionId: string, desde?: string): Promise<Mensaje[]>;
  listarConversaciones(pagina?: number): Promise<ConversacionResumen[]>;
  buscarConversaciones(q: string, pagina?: number): Promise<ConversacionResumen[]>;
  agregarAlCarrito(input: { sku: string; cantidad: number }): Promise<{ ok: true }>;
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
