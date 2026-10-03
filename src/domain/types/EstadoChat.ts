/**
 * Máquina de estado del chat — flujos (a).
 * Inicio → Anonimo(chat_sid 7d) → Autenticado → EsperaLogin / Degradado / Limitado 20/min
 */
export type EstadoChat =
  | "Inicio"
  | "Anonimo"
  | "Autenticado"
  | "EsperaLogin"
  | "Degradado"
  | "Limitado";
