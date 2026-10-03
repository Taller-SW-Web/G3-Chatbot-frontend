"use client";

import { useChatStore } from "@/application/state/chatStore";

/** CARRITO resumido + Ver carrito/Pagar. SPEC-11 */
export function BloqueCarrito({ onVerCarrito, onPagar }: { onVerCarrito: () => void; onPagar: () => void }) {
  const carrito = useChatStore((s) => s.carrito);
  return (
    <div className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-2 wf-card">
      <p className="font-heading text-[15px] uppercase">Carrito ({carrito.count})</p>
      {carrito.lineas.slice(0, 3).map((l) => (
        <div key={l.producto.sku} className="flex justify-between text-[13px]">
          <span className="truncate">{l.producto.nombre} × {l.cantidad}</span>
          <span className="font-semibold">S/ {l.producto.precio * l.cantidad}.00</span>
        </div>
      ))}
      <div className="flex justify-between text-[14px] border-t border-dashed border-border-default pt-2">
        <span className="text-text-secondary">Subtotal</span>
        <span className="font-heading text-[18px]">S/ {carrito.subtotal}.00</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={onVerCarrito} className="wf-btn py-2.5 text-[11px] font-bold bg-white border border-border-default">VER CARRITO</button>
        <button onClick={onPagar} className="wf-btn py-2.5 text-[11px] font-bold bg-action-primary text-surface-ink">PAGAR</button>
      </div>
    </div>
  );
}
