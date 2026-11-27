"use client";

import { useState } from "react";
import { ThumbUpIcon, ThumbDownIcon, CopyIcon, CheckIcon } from "@/shared/ui/icons";
import { useReaccion } from "@/modules/mod-chat/application/useReaccion";

/** Reacciones y copia bajo cada respuesta del bot (SPEC-24 Req. 1). */
export function BotFeedback({ text, mensajeId }: { text: string; mensajeId: string }) {
  const { reaccion, votar } = useReaccion(mensajeId);
  const [copia, setCopia] = useState<"inicial" | "copiado" | "fallo">("inicial");
  const copied = copia === "copiado";

  async function copiar() {
    try {
      await navigator.clipboard.writeText(text);
      setCopia("copiado");
    } catch {
      // Portapapeles no disponible o denegado: no se confirma una copia que no ocurrió.
      setCopia("fallo");
    }
    setTimeout(() => setCopia("inicial"), 1500);
  }

  const btn = (active: boolean) =>
    `w-7 h-7 rounded-full border flex items-center justify-center transition-colors ${active ? "bg-surface-ink text-text-inverse border-surface-ink" : "bg-white text-text-secondary border-border-default hover:border-accent-signal"}`;

  return (
    <div className="flex items-center gap-1.5" aria-label="Calificar respuesta">
      <button
        aria-label="Me sirvió"
        title="Me sirvió"
        aria-pressed={reaccion === "POSITIVE"}
        onClick={() => votar("POSITIVE")}
        className={btn(reaccion === "POSITIVE")}
      >
        <ThumbUpIcon size={16} />
      </button>
      <button
        aria-label="No me sirvió"
        title="No me sirvió"
        aria-pressed={reaccion === "NEGATIVE"}
        onClick={() => votar("NEGATIVE")}
        className={btn(reaccion === "NEGATIVE")}
      >
        <ThumbDownIcon size={16} />
      </button>
      <button aria-label="Copiar respuesta" title={copied ? "¡Copiado!" : "Copiar"} onClick={copiar} className={btn(copied)}>
        {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
      </button>
      <span aria-live="polite" className="text-[11px] font-semibold">
        {copied && <span className="text-success-default">¡Copiado!</span>}
        {copia === "fallo" && <span className="text-error-default">No pudimos copiar</span>}
      </span>
    </div>
  );
}
