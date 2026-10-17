"use client";

import { useRouter } from "next/navigation";
import { TruckIcon } from "../components/icons";
import { EstadoPedido } from "../components/blocks/EstadoPedido";

/**
 * `/seguimiento`: pedido #A-1042 EN CAMINO + hitos + preguntar en el chat.
 * Paridad con Mockups-Wireframes.
 */
export function SeguimientoPage() {
  const router = useRouter();
  return (
    <div className="p-4 flex flex-col gap-3">
      <div className="rounded-md bg-surface-ink text-text-inverse p-3 flex items-center gap-3">
        <span className="w-10 h-10 shrink-0 rounded-sm bg-surface-ink-soft border border-border-inverse flex items-center justify-center"><TruckIcon size={20} /></span>
        <div>
          <p className="font-heading text-[15px] uppercase">Pedido #A-1042 · EN CAMINO</p>
          <p className="text-[12px] text-text-inverse-soft">Av. Siempre Viva 742, Lima · Entrega estimada 18 sep 2026</p>
        </div>
      </div>
      <EstadoPedido hitos={[
        { titulo: "Pago confirmado", fecha: "10 sep · 10:02", done: true },
        { titulo: "En preparación", fecha: "11 sep · 09:00", done: true },
        { titulo: "En centro de despacho", fecha: "12 sep · 14:00", done: true },
        { titulo: "En camino", fecha: "18 sep · estimado", done: false },
      ]} />
      <button disabled title="Próximamente" aria-label="Preguntar en el chat (próximamente)" className="wf-btn py-3 text-[12px] font-bold tracking-wide bg-action-primary text-surface-ink hover:bg-action-primary-hover disabled:opacity-45 disabled:cursor-not-allowed">
        PREGUNTAR EN EL CHAT
      </button>
      <button onClick={() => router.push("/pedidos")} className="text-[14px] font-semibold underline text-text-secondary">Volver al historial</button>
    </div>
  );
}
