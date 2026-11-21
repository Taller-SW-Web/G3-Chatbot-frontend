/** Adjunto de imagen de un mensaje del chat (SPEC-23). Sin React y sin fetch. */

export type AdjuntoMensaje = {
  adjuntoId: string;
  mimeType: string;
  ancho?: number | null;
  alto?: number | null;
  tamanioBytes?: number;
  /** URL firmada de corta vida emitida por el backend. */
  urlMiniatura?: string | null;
  urlImagen?: string | null;
  expiraEn?: string | null;
  /** Blob local mientras el historial no se recarga (SPEC-23 Req. 7). */
  urlLocal?: string;
  nombre?: string;
};

/** Solo se aceptan imágenes: el PDF del chat está fuera del alcance de la spec. */
export const ADJUNTOS_MAX_POR_MENSAJE = 3;
export const ADJUNTO_MAX_BYTES = 5 * 1024 * 1024;
export const ADJUNTO_TIPOS = ["image/jpeg", "image/png", "image/webp"] as const;

export const MENSAJE_ADJUNTO_TIPO_TAMANO = "Solo puedes adjuntar imágenes JPG, PNG o WebP de hasta 5 MB";
export const MENSAJE_ADJUNTO_LIMITE = "Puedes adjuntar hasta 3 imágenes por mensaje";
export const MENSAJE_ADJUNTO_FALLO = "No pudimos subir la imagen";
export const MENSAJE_ADJUNTO_PROCESAR = "No pudimos procesar ese archivo. Adjunta una imagen JPG, PNG o WebP";
