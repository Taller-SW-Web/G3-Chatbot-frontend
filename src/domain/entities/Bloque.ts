/** Entidad Bloque (H2-05 David, SPEC-05 motor-conversacion Req. 4).
 *
 * Unidad visual que manda el backend por WS (eventos token/bloque/fin/error).
 * H2-05 solo pinta TEXTO y ERROR; el mapeo completo Bloque.tipo → componente
 * lo orquesta ChatPage/useChat en otros issues.
 */
import type { BloqueTipo } from "../types/BloqueTipo";

export interface BloqueTexto {
  tipo: "TEXTO";
  texto: string;
}

export interface BloqueError {
  tipo: "ERROR";
  /** Campo code de problem+json: la UI ramifica por code, nunca por texto. */
  code: string;
  detalle?: string;
}

export type Bloque = BloqueTexto | BloqueError | { tipo: BloqueTipo; [k: string]: unknown };
