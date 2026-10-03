import { StatusBadge } from "../StatusBadge";
import { FileAlertIcon } from "../icons";

/** LISTA_RECLAMOS */
export function ListaReclamos({
  items,
}: {
  items: { codigo: string; estado: string; motivo: string; plazo: string }[];
}) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((r) => (
        <div key={r.codigo} className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-1 wf-card">
          <div className="flex justify-between items-center">
            <span className="text-[13px] text-text-secondary">Reclamo #{r.codigo}</span>
            <StatusBadge status="EN_PROCESO" icon={<FileAlertIcon size={16} />}>{r.estado}</StatusBadge>
          </div>
          <div className="flex justify-between text-[14px]"><span className="text-text-secondary">Motivo</span><span>{r.motivo}</span></div>
          <div className="flex justify-between text-[14px]"><span className="text-text-secondary">Plazo</span><span>{r.plazo}</span></div>
        </div>
      ))}
    </div>
  );
}
