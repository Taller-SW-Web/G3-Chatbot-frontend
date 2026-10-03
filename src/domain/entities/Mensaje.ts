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
