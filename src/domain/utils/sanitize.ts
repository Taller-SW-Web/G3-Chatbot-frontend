/** sanitize (H2-05 David, README §1.4 riesgo XSS R7).
 *
 * Todo texto del LLM o de otros módulos pasa por aquí antes de pintarse.
 * Implementación provisional sin dependencias (H2-08 Diego trae DOMPurify +
 * CSP estricta). Escapa &<>"' para evitar dangerouslySetInnerHTML inseguro.
 */
export function sanitizeText(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
