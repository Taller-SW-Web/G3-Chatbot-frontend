/** Acciones que ejecuta el navegador y nunca se envían al BFF (SPEC-05 · delta M5). */
import type { Bloque, BloqueAcciones } from "@/modules/mod-chat/domain/entities/Bloque";
import { esObjeto } from "@/modules/mod-chat/domain/utils/bloquesChat";

export const ACCIONES_CLIENTE = [
  "IR_A_CHECKOUT",
  "CERRAR_SESION",
  "NUEVO_CHAT",
  "BUSCAR_CHATS",
] as const;

export type AccionClienteId = (typeof ACCIONES_CLIENTE)[number];

const ACCIONES_CLIENTE_SET: ReadonlySet<string> = new Set(ACCIONES_CLIENTE);

export function esAccionCliente(id: string): id is AccionClienteId {
  return ACCIONES_CLIENTE_SET.has(id);
}

export type AccionClienteChat = {
  id: AccionClienteId;
  etiqueta: string;
  payload: Record<string, unknown>;
  /** Posición dentro del bloque; junto al id del mensaje forma la clave de idempotencia. */
  indice: number;
};

/** Acciones de cliente presentes en los bloques de un mensaje, en orden. */
export function accionesClienteDeBloques(bloques: readonly Bloque[] | undefined): AccionClienteChat[] {
  const encontradas: AccionClienteChat[] = [];
  for (const bloque of bloques ?? []) {
    const accionesBloque = (bloque as BloqueAcciones).acciones;
    if (bloque.tipo !== "ACCIONES_RAPIDAS" || !Array.isArray(accionesBloque)) continue;
    accionesBloque.forEach((accion, indice) => {
      if (!esAccionCliente(accion.id)) return;
      encontradas.push({
        id: accion.id,
        etiqueta: accion.etiqueta,
        payload: esObjeto(accion.payload) ? accion.payload : {},
        indice,
      });
    });
  }
  return encontradas;
}

/** Término de `BUSCAR_CHATS`: `payload.q` tal como lo devuelve la herramienta. */
export function terminoDeBusqueda(payload: Record<string, unknown>): string {
  return typeof payload.q === "string" ? payload.q.trim() : "";
}
