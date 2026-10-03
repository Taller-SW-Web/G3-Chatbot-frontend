"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/application/state/chatStore";
import { DireccionForm } from "../components/forms/DireccionForm";
import { PagoForm } from "../components/forms/PagoForm";
import type { DireccionInput } from "@/domain/schemas/direccion.schema";
import type { PagoInput } from "@/domain/schemas/pago.schema";
import { totalesCarrito } from "@/domain/entities/CarritoUI";

/**
 * `/checkout`: 2 pasos (dirección → tarjeta) con formularios RHF+Zod,
 * timer e intentos visibles, total con descuento, pago simulado. SPEC-12,14.
 */
export function CheckoutPage() {
  const router = useRouter();
  const carrito = useChatStore((s) => s.carrito);
  const setUltimoPedido = useChatStore((s) => s.setUltimoPedido);
  const [paso, setPaso] = useState<1 | 2>(1);
  const [dir, setDir] = useState<DireccionInput | null>(null);
  const [pago, setPago] = useState<PagoInput | null>(null);
  const [pagando, setPagando] = useState(false);

  const { total } = totalesCarrito(carrito);
  const envio = dir?.distrito ? 12.5 : 0;
  const totalPagar = total + envio;

  async function pagar() {
    if (!dir || !pago) return;
    setPagando(true);
    try {
      setUltimoPedido({
        subtotal: total,
        lineas: carrito.lineas.map((l) => ({ nombre: l.producto.nombre, cantidad: l.cantidad, precio: l.producto.precio })),
        direccion: dir.direccion,
        distrito: dir.distrito,
        nombre: dir.nombre,
        tarjetaLast4: pago.tarjetaNum.replace(/\D/g, "").slice(-4) || "••••",
      });
      router.push("/exito");
    } finally {
      setPagando(false);
    }
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="rounded-md bg-white border border-border-default px-4 py-2.5 flex justify-between items-center text-[13px]">
        <span className="text-text-secondary">Quedan 14:32 · Intentos 3/3</span>
        <span className="font-bold">Paso {paso} de 2</span>
      </div>
      <div className="rounded-md bg-surface-ink text-text-inverse px-4 py-3 flex justify-between items-center">
        <span className="text-[14px] font-semibold">Total a pagar:</span>
        <span className="font-heading text-[20px]">S/ {totalPagar.toFixed(2)}</span>
      </div>

      {paso === 1 ? (
        <>
          <DireccionForm onValid={setDir} />
          <p className="text-[12px] text-text-secondary">
            {dir?.distrito ? `Envío a ${dir.distrito}: S/ 12.50 · llega en 1 día hábil aprox.` : "Envío: se calcula al elegir la dirección"}
          </p>
          <p className="text-[12px] text-text-secondary">El documento del comprobante puede ser distinto al de tu cuenta.</p>
          <button onClick={() => setPaso(2)} disabled={!dir}
            className="wf-btn py-3.5 text-sm font-bold tracking-wide bg-action-primary text-surface-ink hover:bg-action-primary-hover disabled:opacity-45">
            CONFIRMAR Y PAGAR S/ {totalPagar.toFixed(2)}
          </button>
        </>
      ) : (
        <>
          <div className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-2">
            <p className="font-heading text-[15px] tracking-[0.06em] uppercase text-text-primary">Tarjeta · Total a pagar: S/ {totalPagar.toFixed(2)}</p>
            <p className="text-[12px] rounded-md bg-warning-background text-warning-default p-2">Pago simulado – entorno académico. No uses tarjetas reales.</p>
          </div>
          <PagoForm onValid={setPago} />
          <p className="text-[12px] text-text-secondary">En este canal solo aceptamos tarjeta. Tienes 15 minutos y hasta 3 intentos para completar el pago.</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setPaso(1)} className="wf-btn py-3 text-[12px] font-bold bg-white border border-border-default">VOLVER</button>
            <button onClick={pagar} disabled={!pago || pagando} className="wf-btn py-3 text-[12px] font-bold bg-action-primary text-surface-ink disabled:opacity-45">
              {pagando ? "PROCESANDO…" : `PAGAR S/ ${totalPagar.toFixed(2)}`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
