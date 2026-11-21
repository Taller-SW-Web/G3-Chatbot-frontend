"use client";

import {
  availabilityMeta,
  type AvailabilityState,
  type AvailabilityTone,
} from "@/domain/entities/CatalogoUI";

const TONE_CLASS: Record<AvailabilityTone, string> = {
  ok: "bg-accent-volt-soft text-accent-volt-ink",
  low: "bg-accent-signal-soft text-text-primary",
  out: "bg-surface-ink-soft text-text-inverse-soft",
  unknown: "bg-surface-ink-soft text-text-inverse-soft",
};

const TONE_TESTID: Record<AvailabilityTone, string> = {
  ok: "badge-disponible",
  low: "badge-pocas-unidades",
  out: "badge-agotado",
  unknown: "badge-indeterminado",
};

/**
 * Etiqueta única de disponibilidad. `INDETERMINADO` y `SIN_DATO` no pintan
 * badge (SPEC-09 Req. 1, SPEC-10 Req. 3); el llamador decide si muestra un
 * aviso textual aparte.
 */
export function AvailabilityBadge({
  state,
  className = "",
}: {
  state: AvailabilityState;
  className?: string;
}) {
  const { label, tone } = availabilityMeta(state);
  if (label === null) return null;
  return (
    <span
      data-testid={TONE_TESTID[tone]}
      data-availability={state}
      className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${TONE_CLASS[tone]} ${className}`}
    >
      {label}
    </span>
  );
}
