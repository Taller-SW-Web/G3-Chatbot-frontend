"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { turnoChatReducer, turnoInicial } from "@/application/state/turnoChat";
import { cargarHistorialUseCase } from "@/application/use_cases/cargarHistorialUseCase";
import { ejecutarTurnoUseCase } from "@/application/use_cases/ejecutarTurnoUseCase";
import { container } from "@/infrastructure/di/container";

/**
 * Chat de una conversación: historial del backend y turno por SSE (ADR-0021).
 * El estado es local al hook, así que no se filtra entre conversaciones.
 */
export function useChat(conversacionId: string) {
  const [turno, dispatch] = useReducer(turnoChatReducer, turnoInicial);
  const [recarga, setRecarga] = useState(0);
  const [cargadoDe, setCargadoDe] = useState<string | null>(null);
  const [ultimoTexto, setUltimoTexto] = useState<string | null>(null);
  const controladorRef = useRef<AbortController | null>(null);
  const enviandoRef = useRef(false);
  const ultimoTextoRef = useRef<string | null>(null);

  // Un controlador por conversación: al cambiar o desmontar se cancela el turno en curso
  // y se ignoran los resultados tardíos.
  useEffect(() => {
    const controlador = new AbortController();
    controladorRef.current = controlador;
    enviandoRef.current = false;
    dispatch({ tipo: "historialCargando" });
    cargarHistorialUseCase(container.api, conversacionId)
      .then((mensajes) => {
        if (controlador.signal.aborted) return;
        dispatch({ tipo: "historialCargado", mensajes });
        setCargadoDe(conversacionId);
      })
      .catch(() => {
        if (!controlador.signal.aborted) {
          dispatch({ tipo: "historialFallido", code: "ERROR_HISTORIAL" });
        }
      });
    return () => controlador.abort();
  }, [conversacionId, recarga]);

  const enviar = useCallback(
    async (texto: string) => {
      const controlador = controladorRef.current;
      if (!controlador || enviandoRef.current || turno.estado === "cargando") return;
      enviandoRef.current = true;
      ultimoTextoRef.current = texto;
      setUltimoTexto(texto);
      try {
        await ejecutarTurnoUseCase({
          api: container.api,
          stream: container.stream,
          conversacionId,
          texto,
          dispatch: (accion) => {
            if (!controlador.signal.aborted) dispatch(accion);
          },
          signal: controlador.signal,
        });
      } finally {
        if (controladorRef.current === controlador) enviandoRef.current = false;
      }
    },
    [conversacionId, turno.estado]
  );

  /**
   * Reenvía el último texto. Crea un segundo mensaje del cliente: el primero ya quedó
   * guardado en el backend aunque el turno haya fallado.
   */
  const reintentar = useCallback(async () => {
    if (ultimoTextoRef.current !== null) await enviar(ultimoTextoRef.current);
  }, [enviar]);

  const recargar = useCallback(() => {
    if (!enviandoRef.current) setRecarga((n) => n + 1);
  }, []);

  return {
    mensajes: turno.mensajes,
    borrador: turno.borrador,
    estado: turno.estado,
    error: turno.error,
    incompleto: turno.incompleto,
    /** Último texto enviado: la UI lo devuelve al campo si el mensaje no llegó a aceptarse. */
    ultimoTexto,
    /** El historial de esta conversación ya se cargó y no hay una recarga en curso. */
    historialCargado:
      cargadoDe === conversacionId &&
      turno.estado !== "cargando" &&
      turno.error?.code !== "ERROR_HISTORIAL",
    enviar,
    reintentar,
    recargar,
  };
}
