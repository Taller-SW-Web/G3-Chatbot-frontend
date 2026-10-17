import {
  CONVERSACIONES_POR_PAGINA,
  type ChatbotApiPort,
  type ConversacionResumen,
} from "@/ports/outbound/ChatbotApiPort";

/** GET /chat/conversaciones?pagina= orden ultimo_mensaje_en. SPEC-05 Req.1 */
export async function listarConversacionesUseCase(api: ChatbotApiPort, pagina = 1) {
  return api.listarConversaciones(pagina);
}

/**
 * Página siguiente del listado o de la búsqueda; `undefined` si no hay más.
 * El backend devuelve un arreglo sin metadatos: una página incompleta es la última.
 */
export function siguientePaginaConversaciones(
  ultima: ConversacionResumen[],
  paginas: ConversacionResumen[][]
): number | undefined {
  return ultima.length < CONVERSACIONES_POR_PAGINA ? undefined : paginas.length + 1;
}
