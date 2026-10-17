"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import { BotFeedback } from "./BotFeedback";
import type { AvisoChat, ItemChat } from "./chatPresentacion";

export type AccionRapidaChat = {
  id: string;
  etiqueta: string;
  payload?: Record<string, unknown>;
};

/**
 * Ventana de chat: lista de mensajes, respuesta en construcción, aviso de error e
 * indicador de escritura. El feedback (pulgar arriba/abajo + copiar) solo va bajo el
 * último mensaje del bot ya completo.
 */
export function ChatWindow({
  items,
  typing,
  aviso,
  onReintentar,
  onQuickAction,
}: {
  items: ItemChat[];
  typing: boolean;
  aviso?: AvisoChat | null;
  onReintentar?: () => void;
  onQuickAction?: (accion: AccionRapidaChat) => void;
}) {
  let lastBot = -1;
  items.forEach((m, i) => {
    if (m.rol === "bot" && !m.streaming) lastBot = i;
  });

  // Mantiene visible lo último que llegó (mensaje, token, aviso o indicador).
  const finRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    finRef.current?.scrollIntoView?.({ block: "end" });
  }, [items, typing, aviso]);

  return (
    <div className="p-3 flex flex-col gap-2 pb-4">
      {items.length === 0 && (
        <p className="text-sm text-text-secondary bg-white border border-border-default rounded-md p-4 text-center">
          Nuevo chat. Escribe abajo para empezar.
        </p>
      )}
      {items.map((m, i) => {
        if (m.rol === "user") return <MessageBubble key={m.clave} rol="user" texto={m.texto} />;
        return (
          <div key={m.clave} className="self-start w-full max-w-[85%] flex flex-col gap-1.5">
            <MessageBubble
              rol="bot"
              texto={m.texto}
              bloques={m.bloques}
              streaming={m.streaming}
              degradado={m.degradado}
              motivoDegradado={m.motivoDegradado}
              onQuickAction={onQuickAction}
            />
            {i === lastBot && m.texto && <BotFeedback text={m.texto} />}
          </div>
        );
      })}
      {typing && (
        <div
          className="self-start bg-white border border-border-default rounded-full px-3.5 py-2.5 flex items-center gap-1.5"
          aria-label="Escribiendo"
        >
          <span className="tdot" />
          <span className="tdot" style={{ animationDelay: "0.15s" }} />
          <span className="tdot" style={{ animationDelay: "0.3s" }} />
        </div>
      )}
      {aviso && (
        <div
          role="alert"
          data-testid="aviso-chat"
          className="self-start w-full max-w-[85%] rounded-md bg-error-background border border-error-default p-3 flex flex-col gap-2"
        >
          <p className="text-[13px] text-text-primary">{aviso.texto}</p>
          {aviso.reintentable && onReintentar && (
            <button
              onClick={onReintentar}
              className="wf-btn self-start px-4 py-2 text-[12px] font-bold bg-white border border-border-default"
            >
              REINTENTAR
            </button>
          )}
        </div>
      )}
      {/* El margen evita que el compositor fijo tape el último elemento al desplazar. */}
      <div ref={finRef} aria-hidden className="scroll-mb-24" />
    </div>
  );
}
