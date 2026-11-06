/** Mensajes del reenvío de la confirmación por `code` problem+json (SPEC-16 Req. 3).
 *
 * `undefined` = fallo de red (sin respuesta): recuperable, se puede reintentar.
 */
export function mensajeReenvio(code: string | undefined, status: number | undefined): string {
  if (status === undefined) {
    return "No pudimos conectarnos para reenviar el correo. Revisa tu conexión e inténtalo de nuevo.";
  }
  switch (code) {
    case "LIMITE_REENVIOS_EXCEDIDO":
      return "Ya reenviamos la confirmación 2 veces, el máximo por pedido. Revisa tu carpeta de spam o correo no deseado.";
    case "REQUIERE_SESION":
    case "TOKEN_INVALIDO":
      return "Inicia sesión para reenviar el correo.";
    case "RECURSO_NO_ENCONTRADO":
      return "No encontramos ese pedido en tu cuenta.";
    default:
      return "No pudimos reenviar el correo en este momento. Inténtalo de nuevo en unos segundos.";
  }
}
