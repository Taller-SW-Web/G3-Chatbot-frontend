/** Entidad Mensaje (H2-05 David, SPEC-05 motor-conversacion Req. 4).
 *
 * Fuente: openspec/specs/motor-conversacion (POST /chat/conversaciones/{id}/mensajes → 202 {mensajeId}).
 * Sin React, sin fetch, sin localStorage (regla hexagonal domain/).
 */
export type RolMensaje = "cliente" | "asistente";

export interface Mensaje {
  id: string;
  conversacionId: string;
  rol: RolMensaje;
  timestamp: string;
}
