"use client";

import { useState } from "react";
import { CheckIcon } from "@/shared/ui/icons";
import { MoodHappyIcon } from "@/shared/ui/icons/MoodHappyIcon";
import { MoodNeutralIcon } from "@/shared/ui/icons/MoodNeutralIcon";
import { MoodSadIcon } from "@/shared/ui/icons/MoodSadIcon";
import { httpStatus, isUnavailable, problemCode } from "@/shared/api/httpError";

export type DeliveryMood = "mal" | "regular" | "bien";

type DeliveryRatingProps = {
  pedidoId: string;
  initial?: DeliveryMood | null;
  /** Envía la calificación con su comentario; si falla, el bloque permite reintentar. */
  onRate: (pedidoId: string, mood: DeliveryMood, comentario?: string) => Promise<unknown>;
  /** SPEC-24: permite refrescar el detalle cuando Ventas responde 422 ORDER_NOT_DELIVERED. */
  onNotDelivered?: () => void;
};

type EstadoEnvio = "idle" | "sending" | "rated" | "already" | "not-delivered";

const COMENTARIO_MAX = 1000;

const OPTIONS: { value: DeliveryMood; label: string }[] = [
  { value: "mal", label: "Mal" },
  { value: "regular", label: "Regular" },
  { value: "bien", label: "Bien" },
];

/** Escala acordada con Ventas para el CSAT: 1 (mal), 3 (regular) y 5 (bien). */
export function puntuacionDeMood(mood: DeliveryMood): 1 | 3 | 5 {
  if (mood === "bien") return 5;
  if (mood === "regular") return 3;
  return 1;
}

function MoodIcon({ value, size = 24 }: { value: DeliveryMood; size?: 24 }) {
  if (value === "mal") return <MoodSadIcon size={size} />;
  if (value === "regular") return <MoodNeutralIcon size={size} />;
  return <MoodHappyIcon size={size} />;
}

/**
 * DeliveryRating — CSAT de la entrega (SPEC-24): 3 caritas, comentario opcional
 * y envío a Ventas. Client Component (interactivo). Uno por pedido: recibe
 * pedidoId para diferenciar calificaciones cuando haya varios entregados.
 * La inyecta `app/pedido/page.tsx` como slot de `OrderDetailPage`; el adapter
 * que envía la calificación vive en este módulo (mod-postventa).
 * Paridad con Mockups-Wireframes (SPEC-24).
 */
export function DeliveryRating({ pedidoId, initial = null, onRate, onNotDelivered }: DeliveryRatingProps) {
  const [mood, setMood] = useState<DeliveryMood | null>(initial);
  const [comentario, setComentario] = useState("");
  const [estado, setEstado] = useState<EstadoEnvio>(initial ? "rated" : "idle");
  const [error, setError] = useState<string | null>(null);

  const enviar = async () => {
    if (!mood || estado === "sending") return;
    setEstado("sending");
    setError(null);
    try {
      await onRate(pedidoId, mood, comentario.trim() || undefined);
      setEstado("rated");
    } catch (err) {
      const code = problemCode(err);
      const status = httpStatus(err);
      if (code === "CSAT_ALREADY_SUBMITTED" || status === 409) {
        setEstado("already");
      } else if (code === "ORDER_NOT_DELIVERED") {
        setEstado("not-delivered");
        onNotDelivered?.();
      } else if (status === 403) {
        setEstado("idle");
        setError("No pudimos enviar tu calificación, intenta de nuevo");
      } else if (status === 503 || isUnavailable(err)) {
        setEstado("idle");
        setError("No pudimos enviar tu calificación, intenta de nuevo más tarde");
      } else {
        setEstado("idle");
        setError("No pudimos enviar tu calificación, intenta de nuevo");
      }
    }
  };

  if (estado === "rated" || estado === "already") {
    return (
      <div
        className="rounded-md bg-surface-cloud-subtle border border-border-default p-3 flex flex-col gap-2"
        aria-label={`Calificar entrega del pedido ${pedidoId}`}
      >
        <div className="flex items-center gap-1.5" role="status">
          <span className="w-9 h-9 shrink-0 rounded-full bg-surface-ink text-text-inverse flex items-center justify-center">
            {mood ? <MoodIcon value={mood} /> : <CheckIcon size={24} />}
          </span>
          <p className="flex-1 min-w-0 text-[13px] font-bold text-text-primary">
            <CheckIcon size={16} className="inline-block align-[-3px] mr-1" />
            {estado === "already" ? "Ya calificaste este pedido" : "¡Gracias por tu calificación!"}
          </p>
        </div>
      </div>
    );
  }

  if (estado === "not-delivered") {
    return (
      <div
        className="rounded-md bg-surface-cloud-subtle border border-border-default p-3"
        aria-label={`Calificar entrega del pedido ${pedidoId}`}
        role="status"
      >
        <p className="text-[13px] text-text-secondary">Solo puedes calificar pedidos entregados.</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-md bg-surface-cloud-subtle border border-border-default p-3 flex flex-col gap-2"
      aria-label={`Calificar entrega del pedido ${pedidoId}`}
    >
      <p className="font-heading text-[15px] tracking-[0.06em] uppercase text-text-primary">
        Califica tu entrega
      </p>
      <p className="text-[12px] text-text-secondary">
        ¿Cómo llegó tu pedido? Elige una carita y, si quieres, déjanos un comentario.
      </p>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Calificación de entrega">
        {OPTIONS.map((opt) => {
          const elegida = mood === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={elegida}
              aria-label={opt.label}
              title={opt.label}
              onClick={() => setMood(opt.value)}
              className={`wf-btn py-2.5 px-1 bg-white border text-text-secondary flex flex-col items-center gap-1 hover:border-accent-signal hover:text-text-primary ${
                elegida ? "border-accent-signal text-text-primary" : "border-border-default"
              }`}
            >
              <MoodIcon value={opt.value} />
              <span className="text-[11px] font-bold uppercase tracking-wide">{opt.label}</span>
            </button>
          );
        })}
      </div>
      <label htmlFor={`comentario-${pedidoId}`} className="text-[12px] font-semibold text-text-primary">
        Comentario (opcional)
      </label>
      <textarea
        id={`comentario-${pedidoId}`}
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        maxLength={COMENTARIO_MAX}
        rows={2}
        placeholder="Cuéntanos más sobre tu entrega..."
        className="wf-input px-3 py-2.5 text-sm outline-none"
      />
      {error ? (
        <p role="alert" className="text-[12px] text-text-secondary">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => void enviar()}
        disabled={!mood || estado === "sending"}
        className="wf-btn py-2.5 text-[12px] font-bold tracking-wide bg-action-primary text-surface-ink disabled:opacity-45"
      >
        {estado === "sending" ? "ENVIANDO..." : "ENVIAR CALIFICACIÓN"}
      </button>
    </div>
  );
}
