"use client";

/** ACCIONES_RAPIDAS + pregunta aclaratoria. SPEC-05 Req.5 */
export function AccionesRapidas({
  pregunta,
  acciones,
  onAccion,
}: {
  pregunta?: string;
  acciones: { id: string; etiqueta: string }[];
  onAccion?: (accion: { id: string; etiqueta: string }) => void;
}) {
  return (
    <div className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-2">
      {pregunta && <p className="text-[14px] text-text-secondary">{pregunta}</p>}
      <div className="flex flex-wrap gap-2">
        {acciones.map((accion) => (
          <button
            key={accion.id}
            type="button"
            disabled={!onAccion}
            onClick={() => onAccion?.(accion)}
            className="wf-chip px-3 py-1.5 text-[12px] font-semibold text-text-primary hover:border-accent-signal disabled:cursor-not-allowed disabled:opacity-60"
          >
            {accion.etiqueta}
          </button>
        ))}
      </div>
    </div>
  );
}
