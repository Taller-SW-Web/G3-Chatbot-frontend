"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TruckIcon, CheckIcon, RefreshIcon, FileAlertIcon } from "../components/icons";
import { StatusBadge } from "../components/StatusBadge";
import { ListaPedidos } from "../components/blocks/ListaPedidos";
import { EstadoPedido } from "../components/blocks/EstadoPedido";
import { ListaReclamos } from "../components/blocks/ListaReclamos";
import { ListaDevoluciones } from "../components/blocks/ListaDevoluciones";
import { useChatStore } from "@/application/state/chatStore";

type Tab = "proceso" | "entregados" | "reembolso" | "reclamos";

/** `/pedidos` pestañas En proceso/Entregados/Reembolsos(+Reclamos). SPEC-17,18,21,22 */
export function OrderHistoryPage({ initialTab = "proceso" }: { initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const router = useRouter();
  const setMensajePendiente = useChatStore((s) => s.setMensajePendiente);

  function preguntar(user: string, bot: string) {
    setMensajePendiente({ user, bot });
    router.push("/chat/consulta");
  }

  return (
    <div className="p-4 flex flex-col gap-3">
      <div className="grid grid-cols-4 gap-1 bg-white border border-border-default rounded-md p-1">
        {(["proceso", "entregados", "reembolso", "reclamos"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-sm py-2 text-[10px] font-bold tracking-wide transition-colors ${tab === t ? "bg-surface-ink text-text-inverse" : "text-text-secondary"}`}>
            {t === "proceso" ? "En proceso" : t === "entregados" ? "Entregados" : t === "reembolso" ? "Reembolso/ Cambio" : "Reclamos"}
          </button>
        ))}
      </div>

      {tab === "proceso" && (
        <div className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-1 wf-card">
          <div className="flex justify-between items-center">
            <span className="text-[13px] text-text-secondary">Pedido #A-1042</span>
            <StatusBadge status="EN_CAMINO" icon={<TruckIcon size={16} />}>EN CAMINO</StatusBadge>
          </div>
          <EstadoPedido hitos={[
            { titulo: "Pago confirmado", fecha: "10 sep · 10:02", done: true },
            { titulo: "En preparación", fecha: "11 sep · 09:00", done: true },
            { titulo: "En centro de despacho", fecha: "12 sep · 14:00", done: true },
            { titulo: "En camino", fecha: "18 sep · estimado", done: false },
          ]} />
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button onClick={() => router.push("/seguimiento")}
              className="wf-btn py-2.5 text-[11px] font-bold bg-action-primary text-surface-ink inline-flex items-center justify-center gap-1"><TruckIcon size={16} />VER SEGUIMIENTO</button>
            <button
              onClick={() => preguntar("Tengo una consulta sobre mi pedido #A-1042", "¡Claro! Tu pedido #A-1042 está EN CAMINO y llega el 18 sep a Av. Siempre Viva 742, Lima. ¿Quieres el detalle del seguimiento o ayuda con algo más?")}
              className="wf-btn py-2.5 text-[11px] font-bold bg-white border border-border-default text-text-primary">PREGUNTAR EN EL CHAT</button>
          </div>
        </div>
      )}

      {tab === "entregados" && (
        <div className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-1 wf-card">
          <div className="flex justify-between items-center">
            <span className="text-[13px] text-text-secondary">Pedido #A-0987</span>
            <StatusBadge status="ENTREGADO" icon={<CheckIcon size={16} />}>ENTREGADO</StatusBadge>
          </div>
          <ListaPedidos pedidos={[{ id: "#A-0987", direccion: "Calle Los Olivos 120, Lima", fecha: "2 sep 2026" }]} />
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button onClick={() => router.push("/reclamo")} className="wf-btn py-2.5 text-[11px] font-bold bg-white border border-border-default inline-flex items-center justify-center gap-1"><FileAlertIcon size={16} />RECLAMAR</button>
            <button onClick={() => router.push("/devolucion")} className="wf-btn py-2.5 text-[11px] font-bold bg-white border border-border-default inline-flex items-center justify-center gap-1"><RefreshIcon size={16} />DEVOLVER</button>
          </div>
          <button
            onClick={() => preguntar("Tengo una consulta sobre mi pedido entregado #A-0987", "Tu pedido #A-0987 fue ENTREGADO el 2 sep en Calle Los Olivos 120, Lima. ¿Necesitas reportar un problema o solicitar un cambio?")}
            className="wf-btn py-2.5 text-[11px] font-bold mt-2 w-full bg-surface-ink text-text-inverse">PREGUNTAR EN EL CHAT</button>
        </div>
      )}

      {tab === "reembolso" && (
        <div className="flex flex-col gap-3">
          <ListaDevoluciones items={[
            { codigo: "#R-0312", estado: "EN REVISIÓN", motivo: "Talla incorrecta", fecha: "10 sep 2026" },
            { codigo: "DEV-2026-00045", estado: "APROBADO", motivo: "Cambio 41 → 42", fecha: "8 sep 2026" },
          ]} />
          <button
            onClick={() => preguntar("Tengo una consulta sobre mi solicitud DEV-2026-0042", "Tu solicitud DEV-2026-0042 por talla incorrecta está En revisión. Te avisaremos por correo al aprobarse. ¿Te ayudo en algo más?")}
            className="wf-btn py-2.5 text-[11px] font-bold w-full bg-surface-ink text-text-inverse">PREGUNTAR EN EL CHAT</button>
        </div>
      )}

      {tab === "reclamos" && (
        <div className="flex flex-col gap-3">
          <ListaReclamos items={[
            { codigo: "REC-2026-0118", estado: "EN PROCESO", motivo: "Producto defectuoso", plazo: "15 días hábiles" },
          ]} />
          <button
            onClick={() => preguntar("Tengo una consulta sobre mi reclamo REC-2026-0118", "Tu reclamo REC-2026-0118 sigue En revisión y el plazo es de 15 días hábiles. ¿Quieres agregar más información?")}
            className="wf-btn py-2.5 text-[11px] font-bold w-full bg-surface-ink text-text-inverse">PREGUNTAR EN EL CHAT</button>
        </div>
      )}
    </div>
  );
}
