import type { Bloque } from "@/modules/mod-chat/domain/entities/Bloque";
import type { AdjuntoMensaje } from "@/modules/mod-chat/domain/entities/Adjunto";
import type { Mensaje } from "@/modules/mod-chat/domain/entities/Mensaje";

function esObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function textoRequerido(item: Record<string, unknown>, campo: string, i: number): string {
  const valor = item[campo];
  if (typeof valor !== "string") {
    throw new Error(`Historial inválido: el mensaje ${i} no tiene "${campo}" de tipo texto`);
  }
  return valor;
}

/** `{ blocks: [...] }` o arreglo directo → bloques; cualquier otra forma se omite. */
function extraerBloques(valor: unknown): Bloque[] | undefined {
  const lista = Array.isArray(valor) ? valor : esObjeto(valor) ? valor.blocks : undefined;
  if (!Array.isArray(lista)) return undefined;
  return lista.every(esObjeto) ? (lista as unknown as Bloque[]) : undefined;
}

/** Adjuntos con URL firmada del historial (SPEC-23 Req. 7); las filas inválidas se omiten. */
function extraerAdjuntos(valor: unknown): AdjuntoMensaje[] | undefined {
  if (!Array.isArray(valor)) return undefined;
  const items = valor
    .filter(esObjeto)
    .map((item): AdjuntoMensaje | null => {
      const id = item.adjuntoId ?? item.id;
      if (typeof id !== "string" || !id) return null;
      const texto = (v: unknown) => (typeof v === "string" ? v : null);
      return {
        adjuntoId: id,
        mimeType: texto(item.mimeType ?? item.mime_type) ?? "image/jpeg",
        ancho: typeof item.ancho === "number" ? item.ancho : null,
        alto: typeof item.alto === "number" ? item.alto : null,
        urlMiniatura: texto(item.urlMiniatura ?? item.url_miniatura),
        urlImagen: texto(item.urlImagen ?? item.url_imagen),
        expiraEn: texto(item.expiraEn ?? item.expira_en),
      };
    })
    .filter((item): item is AdjuntoMensaje => item !== null);
  return items.length > 0 ? items : undefined;
}

/** Convierte el cuerpo de GET /chat/conversaciones/{id}/mensajes en `Mensaje[]`. */
export function mapearHistorial(cuerpo: unknown): Mensaje[] {
  if (!Array.isArray(cuerpo)) {
    throw new Error("Historial inválido: se esperaba una lista de mensajes");
  }
  return cuerpo.map((item, i) => {
    if (!esObjeto(item)) {
      throw new Error(`Historial inválido: el mensaje ${i} no es un objeto`);
    }
    const rol = item.rol;
    if (rol !== "user" && rol !== "bot") {
      throw new Error(`Historial inválido: el mensaje ${i} tiene un "rol" desconocido`);
    }
    const mensaje: Mensaje = {
      id: textoRequerido(item, "id", i),
      conversacionId: textoRequerido(item, "conversacionId", i),
      rol,
      texto: textoRequerido(item, "texto", i),
      creadoEn: textoRequerido(item, "creadoEn", i),
    };
    const bloques = extraerBloques(item.bloques);
    if (bloques) mensaje.bloques = bloques;
    const adjuntos = extraerAdjuntos(item.adjuntos);
    if (adjuntos) mensaje.adjuntos = adjuntos;
    return mensaje;
  });
}
