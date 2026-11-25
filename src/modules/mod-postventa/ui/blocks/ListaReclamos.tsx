import { StatusBadge } from "@/shared/ui/StatusBadge";
import { FileAlertIcon } from "@/shared/ui/icons";
import type { ReclamoBloqueResumen } from "@/modules/mod-postventa/ui/blocks/tipos";

function variante(estado: string) {
  const normalizado = estado.toUpperCase();
  if (["RESUELTO", "RESUELTA", "ATENDIDO", "ATENDIDA"].includes(normalizado)) return "success" as const;
  if (["RECHAZADO", "RECHAZADA", "VENCIDO", "VENCIDA"].includes(normalizado)) return "error" as const;
  return "warning" as const;
}

/** LISTA_RECLAMOS: código, fecha, pedido, motivo y estado para elegir. SPEC-20. */
export function ListaReclamos({
  reclamos,
  onSeleccionar,
}: {
  reclamos: ReclamoBloqueResumen[];
  /** Envía el código elegido al chat (`CONSULTAR_RECLAMO {codigoSeguimiento}`). */
  onSeleccionar?: (codigoSeguimiento: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3" data-testid="bloque-lista-reclamos">
      {reclamos.map((r) => (
        <div key={r.codigoSeguimiento} className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-1 wf-card">
          <div className="flex justify-between items-center gap-2">
            <span className="text-[13px] text-text-secondary">Reclamo {r.codigoSeguimiento}</span>
            <StatusBadge variant={variante(r.estado)} icon={<FileAlertIcon size={16} />}>{r.estadoEtiqueta}</StatusBadge>
          </div>
          <div className="flex justify-between gap-3 text-[14px]"><span className="text-text-secondary">Fecha</span><span>{r.fecha}</span></div>
          {r.pedidoId && <div className="flex justify-between gap-3 text-[14px]"><span className="text-text-secondary">Pedido</span><span>{r.pedidoId}</span></div>}
          <div className="flex justify-between gap-3 text-[14px]"><span className="text-text-secondary">Motivo</span><span className="text-right">{r.motivo}</span></div>
          {r.fechaLimiteSLA && <div className="flex justify-between gap-3 text-[14px]"><span className="text-text-secondary">Plazo</span><span>{r.fechaLimiteSLA}</span></div>}
          <button
            type="button"
            disabled={!onSeleccionar}
            onClick={() => onSeleccionar?.(r.codigoSeguimiento)}
            className="wf-btn mt-1 py-2.5 text-[11px] font-bold bg-action-primary text-surface-ink disabled:opacity-45 disabled:cursor-not-allowed"
          >
            VER RECLAMO
          </button>
        </div>
      ))}
    </div>
  );
}
