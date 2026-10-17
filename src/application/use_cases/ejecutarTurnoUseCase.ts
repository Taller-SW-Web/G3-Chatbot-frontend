import type { AccionTurno } from "@/application/state/turnoChat";
import { cargarHistorialUseCase } from "@/application/use_cases/cargarHistorialUseCase";
import { enviarMensajeUseCase, validarMensaje } from "@/application/use_cases/enviarMensajeUseCase";
import type { Mensaje } from "@/domain/entities/Mensaje";
import type { ChatbotApiPort } from "@/ports/outbound/ChatbotApiPort";
import {
  ChatStreamError,
  type ChatStreamEvento,
  type ChatStreamPort,
} from "@/ports/outbound/ChatStreamPort";

export type EjecutarTurnoInput = {
  api: ChatbotApiPort;
  stream: ChatStreamPort;
  conversacionId: string;
  texto: string;
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
  const { api, stream, conversacionId, dispatch, signal } = input;
  const texto = validarMensaje(input.texto);
  const idTemporal = `u-${Date.now()}`;
  let terminado = false;

  dispatch({
    tipo: "usuarioAgregado",
    mensaje: {
      id: idTemporal,
      conversacionId,
      rol: "user",
      texto,
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
    await enviarMensajeUseCase(stream, conversacionId, texto, onEvento, signal);
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
