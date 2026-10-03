import { StatusBadge } from "../StatusBadge";
import { RefreshIcon, CheckIcon } from "../icons";

/** CONSTANCIA_DEVOLUCION + resolucion.reembolso, 7 días naturales. SPEC-21,22 */
export function ConstanciaDevolucion({ codigo }: { codigo: string }) {
  return (
    <div className="rounded-md bg-white border border-border-default p-3 text-[12px] text-text-secondary">
      Solicitud <strong className="text-text-primary">{codigo}</strong> registrada · Plazo 7 días naturales desde la entrega
    </div>
  );
}

export function EstadoDevolucion({ codigo, estado }: { codigo: string; estado: "EN REVISIÓN" | "APROBADO" | string }) {
  return (
    <div className="rounded-md bg-white border border-border-default p-3 flex justify-between items-center">
      <span className="text-[13px] text-text-secondary">{codigo}</span>
      <StatusBadge status={estado === "APROBADO" ? "APROBADO" : "EN_REVISION"}
        icon={estado === "APROBADO" ? <CheckIcon size={16} /> : <RefreshIcon size={16} />}>{estado}</StatusBadge>
    </div>
  );
}
