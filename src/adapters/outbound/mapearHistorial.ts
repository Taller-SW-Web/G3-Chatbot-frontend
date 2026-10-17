import type { Bloque } from "@/domain/entities/Bloque";
import type { Mensaje } from "@/domain/entities/Mensaje";

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
    return mensaje;
  });
}
