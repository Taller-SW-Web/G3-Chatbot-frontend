"use client";

import { sanitize } from "@/domain/utils/sanitize";
import type { DatosCarritoBloque } from "@/domain/entities/Bloque";

/** CARRITO resumido + Ver carrito/Pagar. SPEC-11.
 * Pinta solo el bloque del servidor: precios y stock vienen del backend,
 * nunca del store local (el store solo guarda count/subtotal para el badge).
 */
export function BloqueCarrito({
  datos,
  onVerCarrito,
  onPagar,
}: {
  datos: DatosCarritoBloque;
  onVerCarrito: () => void;
  onPagar: () => void;
}) {
  const total = datos.total ?? datos.subtotal;
  return (
    <div
      data-testid="bloque-carrito"
      className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-2 wf-card"
    >
      <p className="font-heading text-[15px] uppercase">
        Carrito ({datos.lineas.length})
      </p>
      {datos.lineas.slice(0, 3).map((l) => (
        <div key={l.item_id} className="flex justify-between text-[13px] gap-2">
          <span className="truncate">
            {sanitize(l.nombre)} · {l.cantidad}
            {!l.disponible && (
              <span data-testid="linea-no-disponible" className="ml-1 text-error-default">
                — Ya no disponible
              </span>
            )}
          </span>
          <span className="font-semibold shrink-0">S/ {(l.precio * l.cantidad).toFixed(2)}</span>
        </div>
      ))}
      {(datos.avisos ?? []).map((aviso, i) => (
        <p key={i} role="status" className="text-[12px] text-text-secondary">
          {sanitize(aviso)}
        </p>
      ))}
      <div className="flex justify-between text-[14px] border-t border-dashed border-border-default pt-2">
        <span className="text-text-secondary">Total</span>
        <span className="font-heading text-[18px]">S/ {total.toFixed(2)}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onVerCarrito}
          data-testid="btn-ver-carrito"
          className="wf-btn py-2.5 text-[11px] font-bold bg-white border border-border-default"
        >
          VER CARRITO
        </button>
        <button
          onClick={onPagar}
          data-testid="btn-pagar"
          className="wf-btn py-2.5 text-[11px] font-bold bg-action-primary text-surface-ink"
        >
          PAGAR
        </button>
      </div>
    </div>
  );
}
