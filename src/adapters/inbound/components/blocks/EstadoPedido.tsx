import { CheckIcon, TruckIcon } from "../icons";

/** ESTADO_PEDIDO + timeline Ventas/Despacho. SPEC-17,18 */
export function EstadoPedido({
  hitos,
}: {
  hitos: { titulo: string; fecha: string; done: boolean }[];
}) {
  return (
    <div className="rounded-md bg-white border border-border-default p-3">
      {hitos.map((h, i) => (
        <div key={h.titulo} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${h.done ? "bg-surface-ink border-surface-ink text-text-inverse" : "bg-accent-volt border-surface-ink text-surface-ink"}`}>
              {h.done ? <CheckIcon size={16} /> : <TruckIcon size={16} />}
            </div>
            {i < hitos.length - 1 && <div className={`w-[2px] flex-1 ${h.done ? "bg-surface-ink" : "bg-border-default"}`} />}
          </div>
          <div className="pb-4"><p className="text-[14px] font-bold">{h.titulo}</p><p className="text-[12px] text-text-secondary">{h.fecha}</p></div>
        </div>
      ))}
    </div>
  );
}
