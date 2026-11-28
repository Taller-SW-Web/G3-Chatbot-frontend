import { CheckIcon, TruckIcon } from "@/shared/ui/icons";
import type {
  HitoPedido,
  PedidoBloqueDetalle,
  SeguimientoBloque,
} from "@/modules/mod-orders/ui/blocks/tipos";

function LineaPedido({
  pedido,
}: {
  pedido: PedidoBloqueDetalle;
}) {
  const envio = pedido.envio;
  return (
    <div className="flex flex-col gap-1 border-b border-border-default pb-3">
      <div className="flex justify-between items-center gap-2">
        <p className="font-heading text-[15px] uppercase">Pedido {pedido.pedidoId}</p>
        <span className="text-[12px] text-text-secondary">{pedido.estadoEtiqueta}</span>
      </div>
      <div className="flex justify-between gap-3 text-[13px]"><span className="text-text-secondary">Fecha</span><span>{pedido.fecha}</span></div>
      <div className="flex justify-between gap-3 text-[13px]"><span className="text-text-secondary">Total</span><span className="font-bold">{pedido.total}</span></div>
      {envio && (
        <p className="text-[13px] text-text-secondary">
          Entrega: {[envio.direccion, envio.distrito].filter(Boolean).join(" · ") || "por confirmar"}
        </p>
      )}
      {pedido.items && pedido.items.length > 0 && (
        <ul className="text-[13px] text-text-secondary flex flex-col gap-0.5">
          {pedido.items.map((item, i) => (
            <li key={`${item.sku ?? item.productoId ?? "item"}-${i}`}>
              {item.cantidad ?? 1} × {item.descripcion ?? item.sku ?? "Producto"}
            </li>
          ))}
        </ul>
      )}
      {pedido.canal && <p className="text-[12px] text-text-secondary">Canal: {pedido.canal}</p>}
    </div>
  );
}

function HitosVentas({ hitos }: { hitos: HitoPedido[] }) {
  return (
    <>
      {hitos.map((h, i) => (
        <div key={`${h.titulo}-${i}`} className="flex gap-3">
          <div className="flex flex-col items-center">
            {/* Los pasos que aún no ocurren van en gris (SPEC-17 · Scenario: Pedido en preparación). */}
            <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${h.done ? "bg-surface-ink border-surface-ink text-text-inverse" : "bg-white border-border-default text-text-secondary"}`}>
              {h.done ? <CheckIcon size={16} /> : <span className="w-1.5 h-1.5 rounded-full bg-border-default" />}
            </div>
            {i < hitos.length - 1 && <div className={`w-[2px] flex-1 ${h.done ? "bg-surface-ink" : "bg-border-default"}`} />}
          </div>
          <div className="pb-4"><p className={`text-[14px] font-bold ${h.done ? "text-text-primary" : "text-text-secondary"}`}>{h.titulo}</p><p className="text-[12px] text-text-secondary">{h.fecha || "Pendiente"}</p></div>
        </div>
      ))}
    </>
  );
}

function SeguimientoDespacho({
  pedidoId,
  seguimiento,
}: {
  pedidoId?: string;
  seguimiento: SeguimientoBloque;
}) {
  return (
    <section className="flex flex-col gap-2 border-t border-border-default pt-3" data-testid="bloque-seguimiento">
      <p className="font-heading text-[13px] uppercase">Seguimiento del despacho</p>
      <div className="flex justify-between gap-3 text-[13px]"><span className="text-text-secondary">Estado</span><span>{seguimiento.estadoEtiqueta}</span></div>
      {seguimiento.fechaProgramada && (
        <div className="flex justify-between gap-3 text-[13px]"><span className="text-text-secondary">Entrega estimada</span><span>{seguimiento.fechaProgramada}</span></div>
      )}
      {seguimiento.distrito && (
        <div className="flex justify-between gap-3 text-[13px]"><span className="text-text-secondary">Distrito</span><span>{seguimiento.distrito}</span></div>
      )}
      {seguimiento.recibidoPor && (
        <div className="flex justify-between gap-3 text-[13px]"><span className="text-text-secondary">Recibido por</span><span>{seguimiento.recibidoPor}</span></div>
      )}
      {seguimiento.detalleDisponible === false && (
        <p className="text-[13px] text-text-secondary">
          {seguimiento.mensaje || "El detalle del envío no está disponible ahora."}
        </p>
      )}
      {seguimiento.hitos.length > 0 && (
        <ul className="flex flex-col gap-1.5 mt-1">
          {seguimiento.hitos.map((h, i) => (
            <li key={`${h.titulo}-${i}`} className="flex items-center gap-2 text-[13px]">
              {h.completado ? <CheckIcon size={16} /> : <TruckIcon size={16} />}
              <span className={h.completado ? "font-semibold" : "text-text-secondary"}>{h.titulo}</span>
              <span className="ml-auto text-[12px] text-text-secondary">{h.fecha || "Pendiente"}</span>
            </li>
          ))}
        </ul>
      )}
      {seguimiento.detalleDisponible && pedidoId && (
        <a
          href={`/seguimiento?pedidoId=${encodeURIComponent(pedidoId)}`}
          className="wf-btn mt-1 py-2.5 text-center text-[11px] font-bold bg-action-primary text-surface-ink"
        >
          VER SEGUIMIENTO
        </a>
      )}
    </section>
  );
}

/** ESTADO_PEDIDO: estado, hitos de Ventas y seguimiento de Despacho. SPEC-17,18. */
export function EstadoPedido({
  pedido,
  hitos,
  seguimiento,
}: {
  pedido?: PedidoBloqueDetalle;
  hitos: HitoPedido[];
  seguimiento?: SeguimientoBloque;
}) {
  return (
    <div className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-3" data-testid="bloque-estado-pedido">
      {pedido && <LineaPedido pedido={pedido} />}
      {hitos.length > 0 && (
        <div>
          <HitosVentas hitos={hitos} />
        </div>
      )}
      {seguimiento && <SeguimientoDespacho pedidoId={pedido?.pedidoId} seguimiento={seguimiento} />}
    </div>
  );
}
