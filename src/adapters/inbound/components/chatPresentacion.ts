import type { BorradorBot, ErrorTurno, EstadoTurno } from "@/application/state/turnoChat";
import { MENSAJE_MAX_CARACTERES } from "@/application/use_cases/enviarMensajeUseCase";
import type { Bloque } from "@/domain/entities/Bloque";
import type { Mensaje } from "@/domain/entities/Mensaje";

/** Código con el que el hook marca que el historial de la conversación no se pudo cargar. */
export const CODIGO_ERROR_HISTORIAL = "ERROR_HISTORIAL";

/** Elemento que `ChatWindow` pinta: un mensaje consolidado o la respuesta en construcción. */
export type ItemChat = {
  clave: string;
  rol: "user" | "bot";
  texto: string;
  bloques: Bloque[];
  streaming: boolean;
};

/** Aviso de error dentro del chat. Sin `reintentable` el usuario debe corregir y reenviar. */
export type AvisoChat = { texto: string; reintentable: boolean };

const MENSAJE_GENERICO = "Hubo un problema. Inténtalo de nuevo.";

/**
 * Mensaje neutral para el usuario según el code del error (nunca por texto del backend).
 * Con `status` sin code conocido se usa el estado HTTP de la respuesta previa al stream.
 */
export function mensajePorCodigo(code: string, status?: number): string {
  switch (code) {
    case "REQUIERE_SESION":
      return "Inicia sesión para continuar.";
    case "STOCK_INSUFICIENTE":
      return "No hay stock suficiente para esa cantidad.";
    case "CARRITO_DESACTUALIZADO":
      return "El carrito cambió: revisa el nuevo total antes de pagar.";
    case "DEMASIADAS_SOLICITUDES":
      return "Vas muy rápido: espera un momento e inténtalo de nuevo.";
    case "ERROR_INTERNO":
      return "No pudimos generar la respuesta. Inténtalo de nuevo.";
    case "ERROR_RED":
      return "No hay conexión con el servidor. Revisa tu red e inténtalo de nuevo.";
    case "STREAM_INVALIDO":
      return "Recibimos una respuesta que no pudimos leer. Inténtalo de nuevo.";
    case "VALIDACION":
      return `El mensaje no es válido. Debe tener entre 1 y ${MENSAJE_MAX_CARACTERES} caracteres.`;
    case "FUNCIONALIDAD_NO_DISPONIBLE":
      return "Esta función todavía no está disponible.";
    case CODIGO_ERROR_HISTORIAL:
      return "No pudimos cargar la conversación.";
  }
  if (status === 404) return "No encontramos esta conversación.";
  if (status === 400) return "El mensaje no es válido. Revísalo e inténtalo de nuevo.";
  return MENSAJE_GENERICO;
}

/** Mensajes consolidados más, mientras llega, la respuesta del asistente en construcción. */
export function construirItemsChat(mensajes: Mensaje[], borrador: BorradorBot | null): ItemChat[] {
  const items: ItemChat[] = mensajes.map((m) => ({
    clave: m.id,
    rol: m.rol,
    texto: m.texto,
    bloques: m.bloques ?? [],
    streaming: false,
  }));
  if (borrador && (borrador.texto || borrador.bloques.length > 0)) {
    items.push({
      clave: "borrador",
      rol: "bot",
      texto: borrador.texto,
      bloques: borrador.bloques,
      streaming: true,
    });
  }
  return items;
}

/** El indicador de escritura se muestra hasta que llega el primer token o bloque. */
export function mostrarEscribiendo(estado: EstadoTurno, borrador: BorradorBot | null): boolean {
  return estado === "enviando" && !(borrador && (borrador.texto || borrador.bloques.length > 0));
}

/**
 * Aviso del turno: error de stream, error previo al stream o respuesta incompleta.
 * El fallo del historial no entra aquí: lo muestra la página como estado de error propio.
 */
export function avisoDeTurno(
  estado: EstadoTurno,
  error: ErrorTurno | null,
  incompleto: boolean
): AvisoChat | null {
  if (estado === "error" && error && error.code !== CODIGO_ERROR_HISTORIAL) {
    return {
      texto: mensajePorCodigo(error.code, error.status),
      // Con `status` el mensaje nunca se aceptó: el texto vuelve al campo para corregirlo.
      reintentable: error.status === undefined,
    };
  }
  if (incompleto) return { texto: "La respuesta no se completó.", reintentable: true };
  return null;
}

/** Hay un error de carga del historial (la conversación no existe o el backend falló). */
export function historialFallido(estado: EstadoTurno, error: ErrorTurno | null): boolean {
  return estado === "error" && error?.code === CODIGO_ERROR_HISTORIAL;
}

/** Texto enviable: no vacío, sin contar espacios, y dentro del máximo; fuera de turnos en curso. */
export function puedeEnviar(texto: string, estado: EstadoTurno): boolean {
  if (estado === "enviando" || estado === "cargando") return false;
  const limpio = texto.trim();
  return limpio.length > 0 && limpio.length <= MENSAJE_MAX_CARACTERES;
}
