import { StatusBadge } from "../StatusBadge";
import { RefreshIcon, CheckIcon } from "../icons";

/** LISTA_DEVOLUCIONES */
export function ListaDevoluciones({
  items,
}: {
  items: { codigo: string; estado: string; motivo: string; fecha: string }[];
}) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((d) => (
        <div key={d.codigo} className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-1 wf-card">
          <div className="flex justify-between items-center">
            <span className="text-[13px] text-text-secondary">{d.codigo}</span>
            <StatusBadge status={d.estado === "APROBADO" ? "APROBADO" : "EN_REVISION"}
              icon={d.estado === "APROBADO" ? <CheckIcon size={16} /> : <RefreshIcon size={16} />}>{d.estado}</StatusBadge>
          </div>
          <div className="flex justify-between text-[14px]"><span className="text-text-secondary">Motivo</span><span>{d.motivo}</span></div>
          <div className="flex justify-between text-[14px]"><span className="text-text-secondary">Solicitud</span><span>{d.fecha}</span></div>
        </div>
      ))}
    </div>
  );
}
