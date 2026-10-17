import type { Bloque } from "@/domain/entities/Bloque";
import type { Mensaje } from "@/domain/entities/Mensaje";

/** Respuesta del asistente en construcción mientras llegan los eventos SSE. */
export type BorradorBot = {
  texto: string;
  bloques: Bloque[];
  /** Motivo del evento `degradado`; los tokens previos ya se descartaron. */
  degradado: string | null;
};

export type EstadoTurno = "inactivo" | "cargando" | "enviando" | "error";

export type ErrorTurno = { code: string; status?: number };

/** Estado local de una conversación: historial del backend más el turno en curso. */
export type TurnoChat = {
  mensajes: Mensaje[];
  borrador: BorradorBot | null;
  estado: EstadoTurno;
  error: ErrorTurno | null;
  /** El stream terminó sin `fin` ni `error` y el backend no guardó respuesta. */
  incompleto: boolean;
};

export type AccionTurno =
  | { tipo: "historialCargando" }
  | { tipo: "historialCargado"; mensajes: Mensaje[] }
  | { tipo: "historialFallido"; code: string }
  /** Mensaje del cliente agregado de forma optimista con un id temporal. */
  | { tipo: "usuarioAgregado"; mensaje: Mensaje }
  | { tipo: "aceptado"; idTemporal: string; mensajeId: string }
  | { tipo: "token"; texto: string }
  | { tipo: "bloque"; bloque: Bloque }
  | { tipo: "degradado"; motivo: string }
  | { tipo: "fin"; mensajeId: string; conversacionId: string; creadoEn: string }
  | { tipo: "error"; code: string }
  /** Respuesta no 2xx antes del stream: el mensaje nunca se aceptó. */
  | { tipo: "falloPrevio"; idTemporal: string; code: string; status: number }
  | { tipo: "incompleto" }
  | { tipo: "reiniciar" };

export const turnoInicial: TurnoChat = {
  mensajes: [],
  borrador: null,
  estado: "inactivo",
  error: null,
  incompleto: false,
};

const borradorVacio: BorradorBot = { texto: "", bloques: [], degradado: null };

/** Reductor puro del turno de chat (ADR-0021). Sin timers ni fetch. */
export function turnoChatReducer(estado: TurnoChat, accion: AccionTurno): TurnoChat {
  switch (accion.tipo) {
    case "historialCargando":
      return { ...turnoInicial, estado: "cargando" };
    case "historialCargado":
      return { ...turnoInicial, mensajes: accion.mensajes };
    case "historialFallido":
      return { ...turnoInicial, estado: "error", error: { code: accion.code } };
    case "usuarioAgregado":
      return {
        ...estado,
        mensajes: [...estado.mensajes, accion.mensaje],
        borrador: borradorVacio,
        estado: "enviando",
        error: null,
        incompleto: false,
      };
    case "aceptado":
      return {
        ...estado,
        mensajes: estado.mensajes.map((m) =>
          m.id === accion.idTemporal ? { ...m, id: accion.mensajeId } : m
        ),
      };
    case "token": {
      const b = estado.borrador ?? borradorVacio;
      return { ...estado, borrador: { ...b, texto: b.texto + accion.texto } };
    }
    case "bloque": {
      const b = estado.borrador ?? borradorVacio;
      return { ...estado, borrador: { ...b, bloques: [...b.bloques, accion.bloque] } };
    }
    case "degradado": {
      // El contrato obliga a descartar los tokens; los bloques posteriores se conservan.
      const b = estado.borrador ?? borradorVacio;
      return { ...estado, borrador: { ...b, texto: "", degradado: accion.motivo } };
    }
    case "fin": {
      const b = estado.borrador ?? borradorVacio;
      const bot: Mensaje = {
        id: accion.mensajeId,
        conversacionId: accion.conversacionId,
        rol: "bot",
        texto: b.texto,
        ...(b.bloques.length > 0 ? { bloques: b.bloques } : {}),
        ...(b.degradado ? { motivoDegradado: b.degradado } : {}),
        creadoEn: accion.creadoEn,
      };
      return { ...estado, mensajes: [...estado.mensajes, bot], borrador: null, estado: "inactivo" };
    }
    case "error":
      return { ...estado, borrador: null, estado: "error", error: { code: accion.code } };
    case "falloPrevio":
      return {
        ...estado,
        mensajes: estado.mensajes.filter((m) => m.id !== accion.idTemporal),
        borrador: null,
        estado: "error",
        error: { code: accion.code, status: accion.status },
      };
    case "incompleto":
      return { ...estado, borrador: null, estado: "inactivo", incompleto: true };
    case "reiniciar":
      return turnoInicial;
  }
}
