import type { Mensaje } from "@/modules/mod-chat/domain/entities/Mensaje";
import type { Bloque } from "@/modules/mod-chat/domain/entities/Bloque";

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

export type AccionChat = {
  tipo: string;
  payload: Record<string, unknown>;
};

export type ResultadoAccionChat = {
  texto: string;
  bloques: Bloque[];
};

/** Tamaño de página del listado y la búsqueda (backend: CONVERSATIONS_PAGE_SIZE). */
export const CONVERSACIONES_POR_PAGINA = 20;

/**
 * Contrato REST del chat (contratos §1, §2.8).
 * El envío del turno va por `ChatStreamPort`; aquí solo lectura y acciones.
 */
export interface ChatApiPort {
  crearConversacion(): Promise<{ conversacionId: string }>;
  /** Últimos mensajes de la conversación. El envío va por `ChatStreamPort`. */
  cargarHistorial(conversacionId: string): Promise<Mensaje[]>;
  ejecutarAccion(
    conversacionId: string,
    accion: AccionChat
  ): Promise<ResultadoAccionChat>;
  listarConversaciones(pagina?: number): Promise<ConversacionResumen[]>;
  buscarConversaciones(q: string, pagina?: number): Promise<ConversacionResumen[]>;
}
