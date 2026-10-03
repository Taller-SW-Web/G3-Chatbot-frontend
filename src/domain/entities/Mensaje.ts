/** Entidad Mensaje (SPEC-05 motor-conversacion Req. 4).
 *
 * Fuente: openspec/specs/motor-conversacion (POST /chat/conversaciones/{id}/mensajes → 202 {mensajeId}).
 * El adaptador del API traduce role CUSTOMER/ASSISTANT a user/bot.
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