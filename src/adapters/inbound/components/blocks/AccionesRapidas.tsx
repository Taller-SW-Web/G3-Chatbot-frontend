"use client";

/** ACCIONES_RAPIDAS + pregunta aclaratoria. SPEC-05 Req.5 */
export function AccionesRapidas({
  pregunta,
  acciones,
  onAccion,
}: {
  pregunta?: string;
  acciones: string[];
  onAccion: (a: string) => void;
}) {
  return (
    <div className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-2">
      {pregunta && <p className="text-[14px] text-text-secondary">{pregunta}</p>}
      <div className="flex flex-wrap gap-2">
        {acciones.map((a) => (
          <button key={a} onClick={() => onAccion(a)}
            className="wf-chip px-3 py-1.5 text-[12px] font-semibold text-text-primary hover:border-accent-signal">{a}</button>
        ))}
      </div>
    </div>
  );
}
