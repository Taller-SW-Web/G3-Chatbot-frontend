/**
 * Parser incremental de Server-Sent Events (ADR-0021). Puro y sin dependencias.
 * Recibe texto ya decodificado: el adaptador usa `TextDecoder` con `stream: true`,
 * así un carácter UTF-8 partido entre chunks nunca llega incompleto aquí.
 */
export type SseFrame = { event: string; data: string };

export type SseParser = {
  /** Alimenta un chunk y devuelve los frames que quedaron completos. */
  push(chunk: string): SseFrame[];
};

/** Nombre por defecto de un frame sin campo `event` (estándar SSE). */
const EVENTO_POR_DEFECTO = "message";

export function crearSseParser(): SseParser {
  // Texto pendiente de procesar; solo puede contener "\r" como último carácter.
  let buffer = "";
  let evento = "";
  let datos: string[] = [];

  function procesarLinea(linea: string, salida: SseFrame[]): void {
    if (linea === "") {
      // Línea en blanco: cierra el frame. Sin líneas `data` no se emite nada.
      if (datos.length > 0) {
        salida.push({ event: evento || EVENTO_POR_DEFECTO, data: datos.join("\n") });
      }
      evento = "";
      datos = [];
      return;
    }
    if (linea.startsWith(":")) return; // comentario / keep-alive
    const separador = linea.indexOf(":");
    const campo = separador === -1 ? linea : linea.slice(0, separador);
    let valor = separador === -1 ? "" : linea.slice(separador + 1);
    if (valor.startsWith(" ")) valor = valor.slice(1);
    if (campo === "event") evento = valor;
    else if (campo === "data") datos.push(valor);
    // `id`, `retry` y campos desconocidos no se usan.
  }

  return {
    push(chunk) {
      buffer += chunk;
      // Un "\r" final puede ser la mitad de un "\r\n": se retiene hasta el
      // siguiente chunk.
      const retenido = buffer.endsWith("\r");
      const texto = (retenido ? buffer.slice(0, -1) : buffer).replace(/\r\n?/g, "\n");
      const ultimoSalto = texto.lastIndexOf("\n");
      if (ultimoSalto === -1) {
        buffer = retenido ? `${texto}\r` : texto;
        return [];
      }
      buffer = texto.slice(ultimoSalto + 1) + (retenido ? "\r" : "");
      const salida: SseFrame[] = [];
      for (const linea of texto.slice(0, ultimoSalto).split("\n")) {
        procesarLinea(linea, salida);
      }
      return salida;
    },
  };
}
