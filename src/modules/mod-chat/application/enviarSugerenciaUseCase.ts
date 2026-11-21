/** Sugerencia o reporte de bug (SPEC-24 Req. 4). Sin React y sin red. */

import { isUnavailable, problemCode } from "@/shared/api/httpError";
import type {
  ChatApiPort,
  NuevaSugerenciaInput,
  SugerenciaCreada,
} from "@/modules/mod-chat/ports/chatApiPort";

export const SUGERENCIA_TITULO_MIN = 3;
export const SUGERENCIA_DESCRIPCION_MIN = 6;
export const SUGERENCIA_DESCRIPCION_MAX = 1000;

/** Mensaje visible según el problem+json del endpoint. */
export function mensajeSugerencia(error: unknown): string {
  if (problemCode(error) === "DEMASIADAS_SOLICITUDES") {
    return "Ya enviaste varias sugerencias, intenta en un rato";
  }
  if (isUnavailable(error)) return "No pudimos enviar tu sugerencia, intenta de nuevo";
  if (problemCode(error) === "VALIDACION" || problemCode(error) === "DATOS_INVALIDOS") {
    return "Revisa el título y la descripción e intenta de nuevo";
  }
  return "No pudimos enviar tu sugerencia, intenta de nuevo";
}

/** Valida en el cliente y registra la sugerencia (la captura viaja en el mismo POST). */
export async function enviarSugerenciaUseCase(
  api: ChatApiPort,
  input: NuevaSugerenciaInput
): Promise<SugerenciaCreada> {
  const titulo = input.titulo.trim();
  const descripcion = input.descripcion.trim();
  if (titulo.length < SUGERENCIA_TITULO_MIN) {
    throw new Error(`El título debe tener al menos ${SUGERENCIA_TITULO_MIN} caracteres`);
  }
  if (descripcion.length < SUGERENCIA_DESCRIPCION_MIN) {
    throw new Error(`La descripción debe tener al menos ${SUGERENCIA_DESCRIPCION_MIN} caracteres`);
  }
  if (descripcion.length > SUGERENCIA_DESCRIPCION_MAX) {
    throw new Error(`La descripción no puede superar ${SUGERENCIA_DESCRIPCION_MAX} caracteres`);
  }
  return api.enviarSugerencia({
    ...input,
    titulo,
    descripcion,
    correoContacto: input.correoContacto.trim(),
  });
}
