/** BloqueTipo (H2-05 David, SPEC-05 motor-conversacion).
 *
 * Fuente: G3-Chatbot-specs/docs/contratos-integracion.md §2.1 (19 tipos).
 * H2-05 solo necesita TEXTO para MessageBubble; el resto lo resuelven
 * otros issues. Se declara el subset usado + el union completo mínimo.
 */
export const BLOQUE_TEXTO = "TEXTO" as const;
export const BLOQUE_ERROR = "ERROR" as const;
export const BLOQUE_CARRUSEL_PRODUCTOS = "CARRUSEL_PRODUCTOS" as const;

export type BloqueTipo =
  | typeof BLOQUE_TEXTO
  | typeof BLOQUE_ERROR
  | typeof BLOQUE_CARRUSEL_PRODUCTOS;
