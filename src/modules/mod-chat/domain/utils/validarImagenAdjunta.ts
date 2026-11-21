/** Validación de imágenes del compositor antes de subirlas (SPEC-23 Req. 1). */

import {
  ADJUNTO_MAX_BYTES,
  ADJUNTO_TIPOS,
  ADJUNTOS_MAX_POR_MENSAJE,
  MENSAJE_ADJUNTO_LIMITE,
  MENSAJE_ADJUNTO_TIPO_TAMANO,
} from "@/modules/mod-chat/domain/entities/Adjunto";

/** Devuelve el mensaje visible del primer problema, o `null` si el archivo es aceptable. */
export function validarImagenAdjunta(archivo: File, yaAdjuntos: number): string | null {
  if (yaAdjuntos >= ADJUNTOS_MAX_POR_MENSAJE) return MENSAJE_ADJUNTO_LIMITE;
  if (!ADJUNTO_TIPOS.includes(archivo.type as (typeof ADJUNTO_TIPOS)[number])) {
    return MENSAJE_ADJUNTO_TIPO_TAMANO;
  }
  if (archivo.size > ADJUNTO_MAX_BYTES) return MENSAJE_ADJUNTO_TIPO_TAMANO;
  return null;
}
