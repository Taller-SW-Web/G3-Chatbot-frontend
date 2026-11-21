"use client";

/** SELECTOR_VARIANTE / chips atributo faltante. SPEC-09 */
export function SelectorVariante({
  atributo,
  opciones,
  valor,
  onChange,
}: {
  atributo: string;
  opciones: string[];
  valor: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[14px] font-bold">{atributo}: <span className="font-semibold text-text-secondary">{valor}</span></p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={atributo}>
        {opciones.map((o) => (
          <button key={o} onClick={() => onChange(o)} aria-pressed={valor === o}
            className={`wf-chip px-4 py-2 text-[14px] font-bold ${valor === o ? "bg-surface-ink text-text-inverse border-surface-ink" : "text-text-primary"}`}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
