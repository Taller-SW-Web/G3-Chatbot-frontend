"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { TruckIcon, CheckIcon, RefreshIcon, FileAlertIcon } from "@/shared/ui/icons";
import { StatusBadge } from "@/shared/ui/StatusBadge";
import { container } from "@/shared/di/container";

type Tab = "proceso" | "entregados" | "reembolso" | "reclamos";

/**
 * Contenido de las pestañas de postventa. Lo inyecta el composition root
 * (`app/pedidos/page.tsx`) con componentes de `mod-postventa/public`, para que
 * `mod-orders` no dependa de `mod-postventa`.
 */
export type OrderHistorySlots = {
  reembolso?: ReactNode;
  reclamos?: ReactNode;
};

const TABS: Tab[] = ["proceso", "entregados", "reembolso", "reclamos"];
const TAB_LABEL: Record<Tab, string> = {
  proceso: "En proceso",
  entregados: "Entregados",
  reembolso: "Reembolso/Cambio",
  reclamos: "Reclamos",
};

const DATE = new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric" });

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : DATE.format(date);
}

/** `/pedidos` pestañas En proceso/Entregados/Reembolsos/Reclamos. SPEC-17,18,21,22 */
export function OrderHistoryPage({
  initialTab = "proceso",
  slots,
}: {
  initialTab?: Tab;
  slots?: OrderHistorySlots;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const router = useRouter();

  const pedidos = useQuery({
    queryKey: ["pedidos", "historial"],
    queryFn: () => container.pedidos.listarPedidos({ page: 1, pageSize: 20 }),
    enabled: tab === "proceso" || tab === "entregados",
    retry: false,
  });

  const allOrders = pedidos.data?.items ?? [];
  const inProcess = allOrders.filter((o) => o.estado !== "ENTREGADO" && o.estado !== "ANULADO");
  // "Entregados" también muestra los anulados para que el cliente los encuentre;
  // las acciones de postventa solo aplican a ENTREGADO.
  const delivered = allOrders.filter((o) => o.estado === "ENTREGADO" || o.estado === "ANULADO");
  const visibleOrders = tab === "proceso" ? inProcess : delivered;

  return (
    <div className="p-4 flex flex-col gap-3">
      <div className="grid grid-cols-4 gap-1 bg-white border border-border-default rounded-md p-1">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} aria-pressed={tab === t}
            className={`rounded-sm py-2 text-[10px] font-bold tracking-wide transition-colors ${tab === t ? "bg-surface-ink text-text-inverse" : "text-text-secondary"}`}>
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      {(tab === "proceso" || tab === "entregados") && (
        <div className="flex flex-col gap-3">
          {pedidos.isLoading ? <p className="text-[14px] text-text-secondary">Cargando pedidos…</p> : null}
          {pedidos.isError ? <p className="text-[14px] text-error-default">No puedo consultar tus pedidos en este momento.</p> : null}
          {!pedidos.isLoading && !pedidos.isError && visibleOrders.length === 0 ? (
            <p className="text-[14px] text-text-secondary">Aún no tienes pedidos en esta pestaña.</p>
          ) : null}
          {visibleOrders.map((order) => (
            <div key={order.pedidoId} className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-2 wf-card">
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-text-secondary">Pedido {order.pedidoId}</span>
                <StatusBadge
                  variant={order.estado === "ENTREGADO" ? "success" : order.estado === "ANULADO" ? "error" : "warning"}
                  icon={order.estado === "ENTREGADO" ? <CheckIcon size={16} /> : <TruckIcon size={16} />}
                >
                  {order.estadoEtiqueta}
                </StatusBadge>
              </div>
              <div className="flex justify-between text-[14px]">
                <span className="text-text-secondary">Total</span>
                <span>S/ {order.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[14px]">
                <span className="text-text-secondary">Creado</span>
                <span>{formatDate(order.fechaCreacion)}</span>
              </div>
              <button onClick={() => router.push(`/pedido?pedidoId=${encodeURIComponent(order.pedidoId)}`)}
                className="wf-btn py-2.5 text-[11px] font-bold bg-white border border-border-default text-text-primary">
                VER DETALLE
              </button>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button onClick={() => router.push(`/seguimiento?pedidoId=${encodeURIComponent(order.pedidoId)}`)}
                  className="wf-btn py-2.5 text-[11px] font-bold bg-action-primary text-surface-ink inline-flex items-center justify-center gap-1">
                  <TruckIcon size={16} />VER SEGUIMIENTO
                </button>
                {tab === "entregados" && order.estado === "ENTREGADO" ? (
                  <button onClick={() => router.push(`/reclamo?pedidoId=${encodeURIComponent(order.pedidoId)}`)}
                    className="wf-btn py-2.5 text-[11px] font-bold bg-white border border-border-default text-text-primary inline-flex items-center justify-center gap-1">
                    <FileAlertIcon size={16} />REPORTAR PROBLEMA
                  </button>
                ) : (
                  <span />
                )}
              </div>
              {tab === "entregados" && order.estado === "ENTREGADO" ? (
                <button onClick={() => router.push(`/devolucion?pedidoId=${encodeURIComponent(order.pedidoId)}`)}
                  className="wf-btn py-2.5 px-3 text-[11px] font-bold bg-white border border-border-default text-text-primary inline-flex items-center justify-center gap-2 text-center">
                  <RefreshIcon size={16} className="shrink-0 ml-1" />SOLICITAR CAMBIO O DEVOLUCIÓN
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {tab === "reembolso" ? slots?.reembolso ?? null : null}

      {tab === "reclamos" ? slots?.reclamos ?? null : null}
    </div>
  );
}
