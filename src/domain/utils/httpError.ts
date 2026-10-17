/** Lectura del problem+json del adapter sin acoplar la UI a Axios.
 *
 * La UI ramifica por `code` y por HTTP status, nunca por el texto del error.
 * Sin React, sin fetch (regla hexagonal domain/).
 */

type ConRespuesta = {
  response?: { status?: number; data?: { code?: string; detail?: string } };
};

/** HTTP status del error, o undefined si no llegó respuesta (fallo de red). */
export function httpStatus(error: unknown): number | undefined {
  const status = (error as ConRespuesta)?.response?.status;
  return typeof status === "number" ? status : undefined;
}

/** `code` del problem+json, o undefined si el error no trae cuerpo. */
export function problemCode(error: unknown): string | undefined {
  const code = (error as ConRespuesta)?.response?.data?.code;
  return typeof code === "string" ? code : undefined;
}

/** true si el fallo es de red (sin respuesta) o el módulo está caído (503). */
export function isUnavailable(error: unknown): boolean {
  return (
    httpStatus(error) === undefined ||
    httpStatus(error) === 503 ||
    problemCode(error) === "SERVICIO_NO_DISPONIBLE"
  );
}
