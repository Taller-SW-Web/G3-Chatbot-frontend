"use client";

import { useRef, useState } from "react";
import { sanitize } from "@/domain/utils/sanitize";

/** ACCIONES_RAPIDAS + pregunta aclaratoria. SPEC-05 Req.5 */
export function AccionesRapidas({
  pregunta,
  acciones,
  onAccion,
  busy = false,
}: {
  busy?: boolean;
  pregunta?: string;
  acciones: {
    id: string;
    etiqueta: string;
    payload?: Record<string, unknown>;
  }[];
  onAccion?: (accion: {
    id: string;
    etiqueta: string;
    payload?: Record<string, unknown>;
  }) => void | Promise<void>;
}) {
  const pendingRef = useRef(false);
  const [pending, setPending] = useState(false);
  async function select(accion: (typeof acciones)[number]) {
    if (!onAccion || busy || pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    try { await onAccion(accion); } finally { pendingRef.current = false; setPending(false); }
  }
  return (
    <div
      className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-2"
      role="group"
      aria-busy={busy || pending}
      aria-label={pregunta || "Acciones rápidas"}
      data-testid="acciones-rapidas"
    >
      {pregunta && <p className="text-[14px] text-text-secondary">{sanitize(pregunta)}</p>}
      <div className="flex flex-wrap gap-2">
        {acciones.map((accion, index) => (
          <button
            key={`${accion.id}-${index}`}
            type="button"
            disabled={!onAccion || busy || pending}
            onClick={() => void select(accion)}
            className="wf-chip min-h-11 px-3 py-1.5 text-[12px] font-semibold text-text-primary hover:border-accent-signal disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sanitize(accion.etiqueta)}
          </button>
        ))}
      </div>
      {!onAccion && !busy && !pending && (
        <p className="text-[11px] text-text-secondary" role="status">
          Las acciones no están disponibles en este momento.
        </p>
      )}
    </div>
  );
}
