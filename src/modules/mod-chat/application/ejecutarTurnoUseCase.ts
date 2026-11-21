import type { AccionTurno } from "@/modules/mod-chat/application/turnoChat";
import { cargarHistorialUseCase } from "@/modules/mod-chat/application/cargarHistorialUseCase";
import { enviarMensajeUseCase, validarMensaje } from "@/modules/mod-chat/application/enviarMensajeUseCase";
import type { Mensaje } from "@/modules/mod-chat/domain/entities/Mensaje";
import type { AdjuntoMensaje } from "@/modules/mod-chat/domain/entities/Adjunto";
import type { ChatApiPort } from "@/modules/mod-chat/ports/chatApiPort";
import {
  ChatStreamError,
  type ChatStreamEvento,
  type ChatStreamPort,
} from "@/modules/mod-chat/ports/chatStreamPort";

export type EjecutarTurnoInput = {
  api: ChatApiPort;
  stream: ChatStreamPort;
  conversacionId: string;
  texto: string;
  /** Imágenes pendientes ya subidas (SPEC-23). */
  adjuntoIds?: string[];
  /** Miniaturas locales para el mensaje optimista. */
  adjuntos?: AdjuntoMensaje[];
  dispatch: (accion: AccionTurno) => void;
  signal?: AbortSignal;
};

function esAbort(e: unknown, signal?: AbortSignal) {
  return signal?.aborted === true || (e instanceof Error && e.name === "AbortError");
}

/** Hay una respuesta del bot posterior al último mensaje del cliente. */
function tieneRespuestaPosterior(historial: Mensaje[]) {
  const ultimoUser = historial.map((m) => m.rol).lastIndexOf("user");
  return historial.slice(ultimoUser + 1).some((m) => m.rol === "bot");
}

/**
 * Un turno completo: envía el mensaje por SSE y traduce cada evento a una acción del reductor.
 * Rechaza solo si el texto es inválido (antes de despachar nada). ADR-0021.
 */
export async function ejecutarTurnoUseCase(input: EjecutarTurnoInput): Promise<void> {
  const { api, stream, conversacionId, adjuntoIds, adjuntos, dispatch, signal } = input;
  const texto = validarMensaje(input.texto, Boolean(adjuntoIds && adjuntoIds.length > 0));
  const idTemporal = `u-${Date.now()}`;
  let terminado = false;

  dispatch({
    tipo: "usuarioAgregado",
    mensaje: {
      id: idTemporal,
      conversacionId,
      rol: "user",
      texto,
      ...(adjuntos && adjuntos.length > 0 ? { adjuntos } : {}),
      creadoEn: new Date().toISOString(),
    },
  });

  const onEvento = (e: ChatStreamEvento) => {
    switch (e.tipo) {
      case "aceptado":
        dispatch({ tipo: "aceptado", idTemporal, mensajeId: e.mensajeId });
        break;
      case "token":
        dispatch({ tipo: "token", texto: e.texto });
        break;
      case "bloque":
        dispatch({ tipo: "bloque", bloque: e.bloque });
        break;
      case "degradado":
        dispatch({ tipo: "degradado", motivo: e.motivo });
        break;
      case "fin":
        terminado = true;
        dispatch({
          tipo: "fin",
          mensajeId: e.mensajeId,
          conversacionId,
          creadoEn: new Date().toISOString(),
        });
        break;
      case "error":
        terminado = true;
        dispatch({ tipo: "error", code: e.code });
        break;
    }
  };

  try {
    await enviarMensajeUseCase(stream, conversacionId, texto, onEvento, signal, adjuntoIds);
  } catch (e) {
    if (esAbort(e, signal) || terminado) return;
    if (e instanceof ChatStreamError) {
      dispatch({ tipo: "falloPrevio", idTemporal, code: e.code, status: e.status });
    } else {
      dispatch({ tipo: "error", code: "ERROR_RED" });
    }
    return;
  }
  if (terminado) return;

  // El stream terminó sin `fin` ni `error`. Una sola consulta al historial: si el backend no
  // guardó la respuesta (cliente desconectado) no aparecerá después, así que no se reintenta.
  try {
    const historial = await cargarHistorialUseCase(api, conversacionId);
    if (signal?.aborted) return;
    if (tieneRespuestaPosterior(historial)) {
      dispatch({ tipo: "historialCargado", mensajes: historial });
    } else {
      dispatch({ tipo: "incompleto" });
    }
  } catch {
    if (signal?.aborted) return;
    dispatch({ tipo: "incompleto" });
  }
}
