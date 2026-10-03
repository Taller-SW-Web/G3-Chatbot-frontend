"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrashIcon, MinusIcon, PlusIcon } from "../components/icons";
import { AvisoCelularModal } from "../components/AvisoCelularModal";
import { useChatStore } from "@/application/state/chatStore";
import { totalesCarrito, type LineaCarrito } from "@/domain/entities/CarritoUI";

/**
 * `/carrito`: líneas, cantidades (máx 10, "−" en 1 elimina + Deshacer 10s),
 * cupón 20% (SPEC-13), subtotal/descuento/total. SPEC-10,11,13.
 */
export function CartPage() {
  const carrito = useChatStore((s) => s.carrito);
  const setCarrito = useChatStore((s) => s.setCarrito);
  const cliente = useChatStore((s) => s.cliente);
  const setAccionPendiente = useChatStore((s) => s.setAccionPendiente);
  const setAuthOpen = useChatStore((s) => s.setAuthOpen);
  const [cupon, setCupon] = useState(carrito.cupon ?? "");
  const [avisoCelular, setAvisoCelular] = useState(false);
  const [undo, setUndo] = useState<{ linea: LineaCarrito; index: number } | null>(null);
  const router = useRouter();

  const { descuento, total } = totalesCarrito(carrito);

  function guardar(lineas: typeof carrito.lineas, cuponAplicado = carrito.cuponAplicado) {
    setCarrito({
      ...carrito,
      lineas,
      cuponAplicado,
      subtotal: lineas.reduce((a, l) => a + l.cantidad * l.producto.precio, 0),
      count: lineas.reduce((a, l) => a + l.cantidad, 0),
    });
  }

  function disminuir(sku: string) {
    const idx = carrito.lineas.findIndex((l) => l.producto.sku === sku);
    const it = carrito.lineas[idx];
    if (!it) return;
    if (it.cantidad <= 1) {
      guardar(carrito.lineas.filter((l) => l.producto.sku !== sku));
      setUndo({ linea: it, index: idx });
      setTimeout(() => setUndo((u) => (u?.linea.producto.sku === sku ? null : u)), 10000);
    } else {
      guardar(carrito.lineas.map((l) => (l.producto.sku === sku ? { ...l, cantidad: l.cantidad - 1 } : l)));
    }
  }

  function deshacer() {
    if (!undo) return;
    const next = [...carrito.lineas];
    next.splice(Math.min(undo.index, next.length), 0, undo.linea);
    guardar(next);
    setUndo(null);
  }

  function irAPagar() {
    if (!cliente) {
      setAccionPendiente("/checkout");
      setAuthOpen(true);
      return;
    }
    if (!cliente.celularVerificado) {
      setAvisoCelular(true);
      return;
    }
    router.push("/checkout");
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="p-4 flex flex-col gap-3 flex-1">
        {carrito.lineas.map((it) => (
          <div key={it.producto.sku} className="rounded-md bg-white border border-border-default p-3 flex gap-3 wf-card">
            <div className="relative overflow-hidden w-20 h-20 shrink-0 rounded-md flex items-center justify-center text-[32px]"
              style={{ background: "linear-gradient(135deg, var(--color-surface-ink-soft), var(--color-accent-signal-soft), var(--color-surface-ink))" }} role="img" aria-label={it.producto.nombre}>
              <span aria-hidden className="absolute top-0 right-0 w-10 h-10 bg-accent-volt" style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
              <span aria-hidden>👟</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-heading text-[15px] uppercase leading-tight truncate text-text-primary">{it.producto.nombre}</p>
                  <p className="text-[12px] text-text-secondary">{it.producto.categoria}</p>
                  <p className="text-[12px] text-text-secondary">{it.producto.talla} · {it.producto.color}</p>
                  <p className="text-[13px] font-semibold text-text-secondary mt-1">S/ {it.producto.precio}.00</p>
                </div>
                <button aria-label={`Quitar ${it.producto.nombre}`} onClick={() => guardar(carrito.lineas.filter((l) => l.producto.sku !== it.producto.sku))}
                  className="w-8 h-8 shrink-0 wf-btn flex items-center justify-center bg-white border border-border-default text-text-secondary"><TrashIcon size={16} /></button>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <button aria-label="Disminuir" onClick={() => disminuir(it.producto.sku)} className="w-7 h-7 wf-btn flex items-center justify-center bg-surface-cloud border border-border-default"><MinusIcon size={16} /></button>
                <span className="text-sm font-bold w-4 text-center tabular-nums">{it.cantidad}</span>
                <button aria-label="Aumentar" onClick={() => guardar(carrito.lineas.map((l) => (l.producto.sku === it.producto.sku ? { ...l, cantidad: Math.min(10, l.cantidad + 1) } : l)))} className="w-7 h-7 wf-btn flex items-center justify-center bg-surface-cloud border border-border-default"><PlusIcon size={16} /></button>
              </div>
            </div>
          </div>
        ))}
        {carrito.lineas.length === 0 && <p className="text-sm text-text-secondary text-center py-8">Tu carrito está vacío. Prueba con Ver ofertas o Buscar productos.</p>}
        {undo && (
          <div className="rounded-md bg-surface-ink text-text-inverse px-3 py-2.5 flex items-center justify-between text-[13px]" role="status">
            <span>Línea eliminada.</span>
            <button onClick={deshacer} className="font-bold underline">Deshacer</button>
          </div>
        )}
        <p className="text-[12px] text-text-secondary">El máximo por producto es 10 unidades.</p>
        {!carrito.cuponAplicado ? (
          <div className="flex gap-2">
            <input value={cupon} onChange={(e) => setCupon(e.target.value)} placeholder="Cupón de descuento" aria-label="Cupón de descuento" className="flex-1 wf-input px-3 py-2.5 text-[14px] outline-none" />
            <button onClick={() => { if (cupon.trim()) { setCarrito({ ...carrito, cupon: cupon.trim() }); guardar(carrito.lineas, true); } }}
              className="wf-btn px-4 py-2.5 text-[12px] font-bold tracking-wide bg-surface-ink text-text-inverse">APLICAR</button>
          </div>
        ) : (
          <div className="rounded-md bg-accent-volt-soft border border-accent-volt px-3 py-2.5 flex items-center justify-between gap-2">
            <span className="text-[13px] font-bold text-accent-volt-ink">Cupón {carrito.cupon || "PROMO20"} aplicado: -20%</span>
            <button onClick={() => guardar(carrito.lineas, false)} className="text-[12px] font-semibold underline text-accent-volt-ink">Quitar</button>
          </div>
        )}
      </div>
      <div className="border-t border-border-default p-4 flex flex-col gap-2 bg-white sticky bottom-0">
        <div className="flex justify-between items-center text-sm"><span className="text-text-secondary">Subtotal</span><span className="font-semibold text-text-primary">S/ {carrito.subtotal.toFixed(2)}</span></div>
        {carrito.cuponAplicado && (
          <div className="flex justify-between items-center text-sm"><span className="text-text-secondary">Descuento (20%)</span><span className="font-bold text-success-default">- S/ {descuento.toFixed(2)}</span></div>
        )}
        <div className="flex justify-between items-center text-sm"><span className="text-text-secondary">{carrito.cuponAplicado ? "Total" : "Subtotal"}</span><span className="font-heading text-[20px] text-text-primary">S/ {(carrito.cuponAplicado ? total : carrito.subtotal).toFixed(2)}</span></div>
        <button onClick={irAPagar}
          className="wf-btn py-3.5 text-sm font-bold tracking-wide bg-action-primary text-surface-ink hover:bg-action-primary-hover">IR A PAGAR</button>
      </div>

      {avisoCelular && (
        <AvisoCelularModal onVerificar={() => { setAvisoCelular(false); router.push("/cuenta"); }} onClose={() => setAvisoCelular(false)} />
      )}
    </div>
  );
}
