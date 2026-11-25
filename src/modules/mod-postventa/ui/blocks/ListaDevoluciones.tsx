import { StatusBadge } from "@/shared/ui/StatusBadge";
import { RefreshIcon, CheckIcon } from "@/shared/ui/icons";
import type { DevolucionBloqueResumen } from "@/modules/mod-postventa/ui/blocks/tipos";

function variante(estado: string) {
  const normalizado = estado.toUpperCase();
  if (["APROBADO", "APROBADA", "REEMBOLSADO", "REEMBOLSADA", "RESUELTO", "RESUELTA"].includes(normalizado)) return "success" as const;
  if (["RECHAZADO", "RECHAZADA", "ANULADO", "ANULADA"].includes(normalizado)) return "error" as const;
  return "warning" as const;
}

/** LISTA_DEVOLUCIONES: código, pedido, fecha, motivo, estado y reembolso. SPEC-22. */
export function ListaDevoluciones({
  devoluciones,
  onSeleccionar,
}: {
  devoluciones: DevolucionBloqueResumen[];
  /** Envía la solicitud elegida al chat (`CONSULTAR_DEVOLUCION {devolucionId}`). */
  onSeleccionar?: (devolucionId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3" data-testid="bloque-lista-devoluciones">
      {devoluciones.map((d) => (
        <div key={d.devolucionId} className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-1 wf-card">
          <div className="flex justify-between items-center gap-2">
            <span className="text-[13px] text-text-secondary">Solicitud {d.devolucionId}</span>
            <StatusBadge variant={variante(d.estado)} icon={variante(d.estado) === "success" ? <CheckIcon size={16} /> : <RefreshIcon size={16} />}>
              {d.estadoEtiqueta}
            </StatusBadge>
          </div>
          <div className="flex justify-between gap-3 text-[14px]"><span className="text-text-secondary">Pedido</span><span>{d.pedidoId}</span></div>
          <div className="flex justify-between gap-3 text-[14px]"><span className="text-text-secondary">Solicitud</span><span>{d.fecha}</span></div>
          <div className="flex justify-between gap-3 text-[14px]"><span className="text-text-secondary">Motivo</span><span className="text-right">{d.motivo}</span></div>
          {d.estadoReembolso && <div className="flex justify-between gap-3 text-[14px]"><span className="text-text-secondary">Reembolso</span><span>{d.estadoReembolso}</span></div>}
          <button
            type="button"
            disabled={!onSeleccionar}
            onClick={() => onSeleccionar?.(d.devolucionId)}
            className="wf-btn mt-1 py-2.5 text-[11px] font-bold bg-action-primary text-surface-ink disabled:opacity-45 disabled:cursor-not-allowed"
          >
            VER SOLICITUD
          </button>
        </div>
      ))}
    </div>
  );
}
