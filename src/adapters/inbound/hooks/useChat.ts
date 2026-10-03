"use client";

import { useEffect, useRef } from "react";
import { container } from "@/infrastructure/di/container";
import { enviarMensajeUseCase } from "@/application/use_cases/enviarMensajeUseCase";
import { cargarHistorialUseCase } from "@/application/use_cases/cargarHistorialUseCase";
import { useChatStore } from "@/application/state/chatStore";
import { apiConfig } from "@/infrastructure/config/apiConfig";

/**
 * Invoca casos, suscribe store, maneja WS token/bloque/fin/error + polling fallback.
 * SPEC-05 Req.4
 */
export function useChat(conversacionId: string) {
  const mensajes = useChatStore((s) => s.mensajes);
  const escribiendo = useChatStore((s) => s.escribiendo);
  const pushMensaje = useChatStore((s) => s.pushMensaje);
  const setMensajes = useChatStore((s) => s.setMensajes);
  const setEscribiendo = useChatStore((s) => s.setEscribiendo);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let vivo = true;
    // historial inicial
    cargarHistorialUseCase(container.api, { conversacionId }).then((ms) => {
      if (vivo && ms.length > 0) setMensajes(ms);
    });
    // WS
    container.ws.conectar(conversacionId, (e) => {
      if (e.kind === "token") {
        // efecto "escribiendo en vivo": se agrega al último borrador en store
        setEscribiendo(true);
      }
      if (e.kind === "fin") setEscribiendo(false);
      if (e.kind === "error") {
        setEscribiendo(false);
        pushMensaje({
          id: `err-${Date.now()}`,
          conversacionId,
          rol: "bot",
          texto: `Ocurrió un error (${e.code}). Pulsa Reintentar.`,
          creadoEn: new Date().toISOString(),
        });
      }
    });
    // polling fallback cada 2s
    pollRef.current = setInterval(async () => {
      const ultimo = useChatStore.getState().mensajes.at(-1);
      const nuevos = await cargarHistorialUseCase(container.api, {
        conversacionId,
        desde: ultimo?.id,
      });
      if (nuevos.length > 0)
        setMensajes([...useChatStore.getState().mensajes, ...nuevos]);
    }, apiConfig.pollingMs);

    return () => {
      vivo = false;
      container.ws.desconectar();
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversacionId]);

  async function enviar(texto: string) {
    if (!texto.trim()) return;
    pushMensaje({
      id: `u-${Date.now()}`,
      conversacionId,
      rol: "user",
      texto: texto.trim(),
      creadoEn: new Date().toISOString(),
    });
    setEscribiendo(true);
    try {
      await enviarMensajeUseCase(container.api, { conversacionId, texto });
      // Respuesta simulada wireframe (backend la reemplazará por WS real):
      setTimeout(() => {
        setEscribiendo(false);
        pushMensaje({
          id: `b-${Date.now()}`,
          conversacionId,
          rol: "bot",
          texto: "Entendido. Te muestro opciones con stock verificado.",
          creadoEn: new Date().toISOString(),
        });
      }, 900);
    } catch {
      setEscribiendo(false);
    }
  }

  return { mensajes, escribiendo, enviar };
}
