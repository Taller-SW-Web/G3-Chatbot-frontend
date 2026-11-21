import type { Mensaje } from "@/modules/mod-chat/domain/entities/Mensaje";
import type { Bloque } from "@/modules/mod-chat/domain/entities/Bloque";
import type { AdjuntoMensaje } from "@/modules/mod-chat/domain/entities/Adjunto";

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

/** Reacción a un mensaje del asistente (SPEC-24 Req. 1). */
export type ReaccionMensaje = "POSITIVE" | "NEGATIVE";

/** Formulario de sugerencia o bug (SPEC-24 Req. 4). */
export type NuevaSugerenciaInput = {
  tipo: "SUGERENCIA" | "BUG";
  titulo: string;
  descripcion: string;
  correoContacto: string;
  /** Captura opcional (JPG/PNG ≤ 5 MB), subida por el backend al bucket privado. */
  captura?: File;
};

export type SugerenciaCreada = {
  codigoSeguimiento: string;
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
  /** SPEC-23: sube una imagen (multipart) y la deja `PENDING` hasta enviar el mensaje. */
  subirAdjunto(
    conversacionId: string,
    archivo: File,
    onProgress?: (porcentaje: number) => void
  ): Promise<AdjuntoMensaje>;
  /** SPEC-23: quita un adjunto pendiente y sus archivos del bucket. */
  eliminarAdjunto(conversacionId: string, adjuntoId: string): Promise<void>;
  /** SPEC-23: emite una URL firmada nueva para un adjunto de la conversación. */
  obtenerUrlAdjunto(adjuntoId: string): Promise<{
    urlMiniatura?: string | null;
    urlImagen?: string | null;
    expiraEn?: string | null;
  }>;
  /** SPEC-24 Req. 1: registra o cambia la reacción de un mensaje. */
  enviarReaccion(mensajeId: string, reaccion: ReaccionMensaje): Promise<void>;
  /** SPEC-24 Req. 4: registra la sugerencia o bug, con captura opcional. */
  enviarSugerencia(input: NuevaSugerenciaInput): Promise<SugerenciaCreada>;
}
