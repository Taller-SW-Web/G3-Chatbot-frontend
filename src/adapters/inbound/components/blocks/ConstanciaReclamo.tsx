import { StatusBadge } from "../StatusBadge";
import { FileAlertIcon } from "../icons";

/** CONSTANCIA/ESTADO_RECLAMO + LISTA. Plazo 15 días hábiles. SPEC-19,20 */
export function ConstanciaReclamo({ codigo }: { codigo: string }) {
  return (
    <div className="rounded-md bg-white border border-border-default p-3 text-[12px] text-text-secondary">
      Constancia del reclamo <strong className="text-text-primary">{codigo}</strong> · plazo de 15 días hábiles
    </div>
  );
}

export function EstadoReclamo({ codigo, estado }: { codigo: string; estado: string }) {
  return (
    <div className="rounded-md bg-white border border-border-default p-3 flex justify-between items-center">
      <span className="text-[13px] text-text-secondary">{codigo}</span>
      <StatusBadge status="EN_PROCESO" icon={<FileAlertIcon size={16} />}>{estado}</StatusBadge>
    </div>
  );
}
