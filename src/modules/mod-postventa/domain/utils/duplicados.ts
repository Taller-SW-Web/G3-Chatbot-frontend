/** Detección de solicitudes duplicadas de postventa (SPEC-19 Req. 3, SPEC-21 Req. 5). */

import { problemCode, problemField } from "@/shared/api/httpError";

/** Código existente que devuelve el backend en el 409 de duplicado. */
export type SolicitudDuplicada = {
  codigo: string;
  mensaje?: string;
};

export function esReclamoDuplicado(error: unknown): boolean {
  return problemCode(error) === "RECLAMO_DUPLICADO";
}

export function esDevolucionDuplicada(error: unknown): boolean {
  return problemCode(error) === "DEVOLUCION_DUPLICADA";
}

export function solicitudDuplicada(error: unknown): SolicitudDuplicada {
  return {
    codigo:
      problemField(error, "codigoSeguimiento") ??
      problemField(error, "devolucionId") ??
      problemField(error, "codigo") ??
      "",
    mensaje: problemField(error, "detail") ?? problemField(error, "mensaje"),
  };
}
