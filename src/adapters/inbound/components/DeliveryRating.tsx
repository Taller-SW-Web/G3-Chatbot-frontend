"use client";

import { useState } from "react";
import { CheckIcon } from "./icons";
import { MoodHappyIcon } from "./icons/MoodHappyIcon";
import { MoodNeutralIcon } from "./icons/MoodNeutralIcon";
import { MoodSadIcon } from "./icons/MoodSadIcon";

export type DeliveryMood = "mal" | "regular" | "bien";

type DeliveryRatingProps = {
  orderId: string;
  initial?: DeliveryMood | null;
  onRate?: (orderId: string, mood: DeliveryMood) => void;
};

const OPTIONS: { value: DeliveryMood; label: string }[] = [
  { value: "mal", label: "Mal" },
  { value: "regular", label: "Regular" },
  { value: "bien", label: "Bien" },
];

function MoodIcon({ value, size = 24 }: { value: DeliveryMood; size?: 24 }) {
  if (value === "mal") return <MoodSadIcon size={size} />;
  if (value === "regular") return <MoodNeutralIcon size={size} />;
  return <MoodHappyIcon size={size} />;
}

/**
 * DeliveryRating — califica la entrega de un pedido entregado con 3 caritas.
 * Client Component (interactivo). Uno por pedido: recibe orderId para
 * diferenciar calificaciones cuando haya varios entregados.
 * Paridad con Mockups-Wireframes (SPEC-24).
 */
export function DeliveryRating({ orderId, initial = null, onRate }: DeliveryRatingProps) {
  const [mood, setMood] = useState<DeliveryMood | null>(initial);

  const elegir = (value: DeliveryMood) => {
    setMood(value);
    onRate?.(orderId, value);
  };

  return (
    <div
      className="rounded-md bg-surface-cloud-subtle border border-border-default p-3 flex flex-col gap-2"
      aria-label={`Calificar entrega del pedido ${orderId}`}
    >
      <p className="font-heading text-[15px] tracking-[0.06em] uppercase text-text-primary">
        Califica tu entrega
      </p>
      {!mood ? (
        <>
          <p className="text-[12px] text-text-secondary">
            ¿Cómo llegó tu pedido? Toca una carita.
          </p>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Calificación de entrega">
            {OPTIONS.map((opt) => (
              <button
                key={opt.value}
                role="radio"
                aria-checked={false}
                aria-label={opt.label}
                title={opt.label}
                onClick={() => elegir(opt.value)}
                className="wf-btn py-2.5 px-1 bg-white border border-border-default text-text-secondary flex flex-col items-center gap-1 hover:border-accent-signal hover:text-text-primary"
              >
                <MoodIcon value={opt.value} />
                <span className="text-[11px] font-bold uppercase tracking-wide">{opt.label}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="flex items-center gap-1.5 whitespace-nowrap overflow-hidden" role="status">
          <span className="w-9 h-9 shrink-0 rounded-full bg-surface-ink text-text-inverse flex items-center justify-center">
            <MoodIcon value={mood} />
          </span>
          <p className="flex-1 min-w-0 truncate text-[13px] font-bold text-text-primary text-left">
            <CheckIcon size={16} className="inline-block align-[-3px] mr-1" />
            ¡Gracias por su opinión!
          </p>
          <button
            onClick={() => setMood(null)}
            className="text-[12px] font-semibold underline text-text-secondary shrink-0"
          >
            Cambiar
          </button>
        </div>
      )}
    </div>
  );
}
