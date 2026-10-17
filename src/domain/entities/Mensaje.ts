/** Entidad Mensaje (SPEC-05 motor-conversacion Req. 4).
 *
 * Fuente: openspec/specs/motor-conversacion. El historial llega de
 * GET /chat/conversaciones/{id}/mensajes (últimos 50, `rol` ya es user/bot);
 * el turno nuevo se arma en vivo con los eventos SSE del POST del mensaje.
 * Sin React, sin fetch, sin localStorage (regla hexagonal domain/).
 */
import type { Bloque } from "./Bloque";

export type MensajeRol = "user" | "bot";

/** Mensaje de chat. El turno bot puede traer bloques ya validados. */
export type Mensaje = {
  id: string;
  conversacionId: string;
  rol: MensajeRol;
  texto: string;
  bloques?: Bloque[];
  creadoEn: string;
};