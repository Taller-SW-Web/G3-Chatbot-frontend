import type { ChatbotApiPort } from "@/ports/outbound/ChatbotApiPort";

/** Máximo de caracteres de `q` que acepta el backend (400 VALIDACION si se excede). */
export const BUSQUEDA_MAX_CARACTERES = 100;

/** GET /buscar?q= título+mensajes. `null` si no hay término que buscar. SPEC-05 Req.1 */
export async function buscarConversacionesUseCase(
  api: ChatbotApiPort,
  q: string,
  pagina = 1
) {
  const termino = normalizarBusqueda(q);
  if (!termino) return null;
  return api.buscarConversaciones(termino, pagina);
}

/** Recorta espacios y el exceso de caracteres; cadena vacía si no queda término. */
export function normalizarBusqueda(q: string) {
  return q.trim().slice(0, BUSQUEDA_MAX_CARACTERES);
}
