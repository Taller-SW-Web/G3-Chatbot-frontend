"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpIcon, PhotoIcon } from "../components/icons";
import { ChatWindow } from "../components/ChatWindow";
import {
  avisoDeTurno,
  construirItemsChat,
  historialFallido,
  mensajePorCodigo,
  mostrarEscribiendo,
  puedeEnviar,
} from "../components/chatPresentacion";
import { useChat } from "../hooks/useChat";
import { useChatStore } from "@/application/state/chatStore";
import { MENSAJE_MAX_CARACTERES } from "@/application/use_cases/enviarMensajeUseCase";

const SUGERENCIAS = ["Ver ofertas", "Rastrear pedido", "Ayuda con devolución"];

/**
 * `/chat/[id]`: historial y turno en vivo de una conversación real (ADR-0021).
 * El estado del turno vive en `useChat`; esta página solo lo presenta y envía texto.
 * Nunca importa Axios/fetch.
 */
export function ChatPage({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const setPrimerMensaje = useChatStore((s) => s.setPrimerMensaje);
  const setUltimaConversacionId = useChatStore((s) => s.setUltimaConversacionId);
  const {
    mensajes,
    borrador,
    estado,
    error,
    incompleto,
    historialCargado,
    ultimoTexto,
    enviar,
    reintentar,
    recargar,
  } = useChat(conversationId);

  // Ubica el carrito anónimo desde /carrito (SPEC-11: anónimo por conversación).
  useEffect(() => {
    setUltimaConversacionId(conversationId);
  }, [conversationId, setUltimaConversacionId]);

  const [composer, setComposer] = useState("");
  const [errorVisto, setErrorVisto] = useState(error);

  // Si el mensaje no llegó a aceptarse (error previo al stream) el texto vuelve al campo.
  if (error !== errorVisto) {
    setErrorVisto(error);
    if (error?.status !== undefined && ultimoTexto) setComposer(ultimoTexto);
  }

  // Primer mensaje que dejó Home: se envía una sola vez, con el historial ya cargado y la
  // conversación vacía. Se consume del store antes de enviar, así que un segundo efecto
  // (modo estricto o cambio de dependencias) no lo repite.
  useEffect(() => {
    if (!historialCargado) return;
    const texto = useChatStore.getState().primerMensaje;
    if (texto === null) return;
    setPrimerMensaje(null);
    if (mensajes.length === 0) void enviar(texto);
  }, [historialCargado, mensajes.length, enviar, setPrimerMensaje]);

  function enviarTexto(texto: string) {
    if (!puedeEnviar(texto, estado)) return;
    const limpio = texto.trim();
    setComposer("");
    void enviar(limpio);
  }

  if (historialFallido(estado, error)) {
    return (
      <div className="p-4 flex flex-col gap-3" data-testid="chat-error-historial">
        <div role="alert" className="rounded-md bg-error-background border border-error-default p-4 flex flex-col gap-3">
          <p className="text-[14px] font-bold text-error-default">
            {mensajePorCodigo(error?.code ?? "")}
          </p>
          <p className="text-[13px] text-text-primary">
            Puede que el enlace ya no sea válido o que el servidor no responda.
          </p>
          <div className="flex flex-wrap gap-2">
            <button onClick={recargar} className="wf-btn px-4 py-2.5 text-[12px] font-bold bg-action-primary text-surface-ink hover:bg-action-primary-hover">
              REINTENTAR
            </button>
            <button onClick={() => router.push("/")} className="wf-btn px-4 py-2.5 text-[12px] font-bold bg-white border border-border-default">
              VOLVER AL INICIO
            </button>
          </div>
        </div>
      </div>
    );
  }

  const cargando = estado === "cargando" || !historialCargado;
  const bloqueado = !historialCargado || estado === "enviando" || estado === "cargando";
  const aviso = avisoDeTurno(estado, error, incompleto);

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1">
        {cargando && mensajes.length === 0 ? (
          <p role="status" className="p-4 text-sm text-text-secondary text-center">
            Cargando conversación…
          </p>
        ) : (
          <ChatWindow
            items={construirItemsChat(mensajes, borrador)}
            typing={mostrarEscribiendo(estado, borrador)}
            aviso={aviso}
            onReintentar={() => void reintentar()}
            onEnviarAccion={enviarTexto}
          />
        )}
        <div className="px-3 flex flex-wrap gap-2 pb-24">
          {SUGERENCIAS.map((q) => (
            <button
              key={q}
              onClick={() => enviarTexto(q)}
              disabled={bloqueado}
              className="wf-chip px-3 py-1.5 text-[12px] font-semibold bg-white text-text-primary hover:border-accent-signal disabled:opacity-60"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] border-t border-border-default bg-surface-cloud px-3 py-3 flex items-center gap-2">
        <button
          aria-label="Agregar imagen (próximamente)"
          title="Próximamente"
          disabled
          className="w-10 h-10 wf-btn flex items-center justify-center bg-surface-ink-soft text-text-inverse border border-border-inverse disabled:opacity-45 disabled:cursor-not-allowed"
        >
          <PhotoIcon size={20} />
        </button>
        <input
          value={composer}
          maxLength={MENSAJE_MAX_CARACTERES}
          disabled={bloqueado}
          aria-label="Mensaje"
          onChange={(e) => setComposer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") enviarTexto(composer);
          }}
          placeholder="Pregunta por zapatillas, tallas, pedidos…"
          className="flex-1 wf-chip px-4 py-2.5 text-sm outline-none min-w-0 bg-white text-text-primary placeholder:text-text-secondary disabled:opacity-60"
        />
        <button
          aria-label="Enviar"
          disabled={!puedeEnviar(composer, estado)}
          onClick={() => enviarTexto(composer)}
          className="w-10 h-10 wf-btn flex items-center justify-center bg-surface-ink-soft text-text-inverse border border-border-inverse disabled:opacity-45 disabled:cursor-not-allowed"
        >
          <ArrowUpIcon size={20} />
        </button>
      </div>
    </div>
  );
}
