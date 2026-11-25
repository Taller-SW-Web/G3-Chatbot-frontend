import { StatusBadge, type StatusVariant } from "@/shared/ui/StatusBadge";
import type { PedidoBloqueResumen } from "@/modules/mod-orders/ui/blocks/tipos";

/** Variante visual por estado de Ventas; el texto siempre es `estadoEtiqueta`. */
export function varianteDeEstado(estado: string): StatusVariant {
  const normalizado = estado.toUpperCase();
  if (["ENTREGADO", "APROBADO", "APROBADA", "RESUELTO", "RESUELTA", "REEMBOLSADO", "REEMBOLSADA"].includes(normalizado)) {
    return "success";
  }
  if (["RECHAZADO", "RECHAZADA", "ANULADO", "ANULADA", "PAGO_FALLIDO"].includes(normalizado)) {
    return "error";
  }
  if (["EN_CAMINO", "DESPACHADO"].includes(normalizado)) return "info";
  return "warning";
}

/** LISTA_PEDIDOS: elegir entre varios. SPEC-17 · delta M5. */
export function ListaPedidos({
  pedidos,
  onSeleccionar,
  mensaje,
}: {
  pedidos: PedidoBloqueResumen[];
  /** Envía el pedido elegido al chat (`CONSULTAR_PEDIDOS {pedidoId}`). */
  onSeleccionar?: (pedidoId: string) => void;
  mensaje?: string;
}) {
  return (
    <div className="flex flex-col gap-2" data-testid="bloque-lista-pedidos">
      {pedidos.map((p) => (
        <div key={p.pedidoId} className="rounded-md bg-white border border-border-default p-3 text-[14px] flex flex-col gap-1 wf-card">
          <div className="flex justify-between items-center gap-2">
            <span className="text-[13px] text-text-secondary">Pedido {p.pedidoId}</span>
            <StatusBadge variant={varianteDeEstado(p.estado)}>{p.estadoEtiqueta}</StatusBadge>
          </div>
          <div className="flex justify-between gap-3"><span className="text-text-secondary">Fecha</span><span>{p.fecha}</span></div>
          <div className="flex justify-between gap-3"><span className="text-text-secondary">Total</span><span className="font-bold">{p.total}</span></div>
          <div className="flex justify-between gap-3"><span className="text-text-secondary">Canal</span><span>{p.canal}</span></div>
          <button
            type="button"
            disabled={!onSeleccionar}
            onClick={() => onSeleccionar?.(p.pedidoId)}
            className="wf-btn mt-1 py-2.5 text-[11px] font-bold bg-action-primary text-surface-ink disabled:opacity-45 disabled:cursor-not-allowed"
          >
            VER PEDIDO
          </button>
        </div>
      ))}
      {mensaje && <p className="text-[12px] text-text-secondary">{mensaje}</p>}
    </div>
  );
}
