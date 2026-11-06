"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon } from "../components/icons";
import { RatingPopup } from "../components/RatingPopup";
import { useChatStore } from "@/application/state/chatStore";
import { maskEmail } from "@/domain/utils/sanitize";

/** Aviso textual sobre el envío del correo de confirmación (SPEC-16). */
export function avisoConfirmacion(correoEnmascarado?: string, fallbackEmail?: string): string {
  if (correoEnmascarado) {
    const emailConPuntos = correoEnmascarado.endsWith("…") || correoEnmascarado.endsWith(".")
      ? correoEnmascarado
      : `${correoEnmascarado}.`;
    return `Te enviaremos la confirmación a ${emailConPuntos}`;
  }
  return `Te enviaremos la confirmación a ${maskEmail(fallbackEmail ?? "cliente.demo@correo.com")}.`;
}

/**
 * `/exito`: pedido confirmado + detalle + calificación con estrellas.
 * Paridad con Mockups-Wireframes (min-h-full para que el popup cubra todo).
 */
export function OrderSuccessPage() {
  const router = useRouter();
  const pedido = useChatStore((s) => s.ultimoPedido);
  const cliente = useChatStore((s) => s.cliente);
  const [showRating, setShowRating] = useState(true);

  const correo = cliente?.correo ?? "cliente.demo@correo.com";
  const last4 = pedido?.tarjetaLast4 ?? "••••";
  const marca = pedido?.tarjetaMarca || "Tarjeta";
  const orderId = pedido?.orderId || "PED-2026-00891";
  const total = pedido?.total ?? pedido?.subtotal ?? 0;
  const aviso = avisoConfirmacion(pedido?.correoEnmascarado, correo);

  return (
    <div className="relative min-h-full p-6 flex flex-col items-center gap-3 text-center">
      <div className="wf-check w-16 h-16 rounded-full flex items-center justify-center bg-success-background text-success-default"><CheckIcon size={24} /></div>
      <h2 className="font-heading text-[24px] leading-8">¡PEDIDO CONFIRMADO!</h2>
      <p className="text-[14px] text-text-secondary">Pedido {orderId} · {aviso} Entrega estimada en 1 día hábil.</p>
      <div className="rounded-md bg-white border border-border-default w-full p-3 text-left flex flex-col gap-2">
        <div className="flex justify-between text-[14px]"><span className="text-text-secondary">Total pagado</span><span className="font-heading text-[18px]">S/ {total.toFixed(2)}</span></div>
        <div className="border-t border-dashed border-border-default pt-2 flex flex-col gap-1 text-[13px]">
          {(pedido?.lineas ?? []).map((it) => (
            <div key={it.nombre} className="flex justify-between gap-2"><span className="truncate">{it.nombre} × {it.cantidad}</span><span className="font-semibold shrink-0">S/ {(it.precio * it.cantidad).toFixed(2)}</span></div>
          ))}
          {typeof pedido?.costoEnvio === "number" && pedido.costoEnvio > 0 && (
            <div className="flex justify-between gap-2 text-text-secondary"><span>Costo de envío</span><span className="font-semibold shrink-0">S/ {pedido.costoEnvio.toFixed(2)}</span></div>
          )}
        </div>
        <div className="border-t border-dashed border-border-default pt-2 text-[13px] flex flex-col gap-1">
          <div className="flex justify-between gap-2"><span className="text-text-secondary">Tarjeta</span><span className="font-semibold">{marca} •••• {last4}</span></div>
          <div className="flex justify-between gap-2"><span className="text-text-secondary">Entrega</span><span className="font-semibold text-right">{pedido?.direccion || "Dirección de envío"}{pedido?.distrito ? ` · ${pedido.distrito}` : ""}</span></div>
          {pedido?.nombre ? <div className="flex justify-between gap-2"><span className="text-text-secondary">Recibe</span><span className="font-semibold text-right">{pedido.nombre}</span></div> : null}
        </div>
      </div>
      <button onClick={() => router.push("/pedidos")} className="wf-btn w-full py-3 text-sm font-bold tracking-wide bg-action-primary text-surface-ink hover:bg-action-primary-hover">VER ESTADO DEL PEDIDO</button>
      <button onClick={() => router.push("/")} className="wf-btn w-full py-3 text-sm font-bold tracking-wide bg-white border border-border-default">SEGUIR COMPRANDO</button>
      <button onClick={() => setShowRating(true)} className="text-[12px] font-semibold underline text-text-secondary">Calificar mi compra</button>

      {showRating && <RatingPopup onClose={() => setShowRating(false)} />}
    </div>
  );
}
