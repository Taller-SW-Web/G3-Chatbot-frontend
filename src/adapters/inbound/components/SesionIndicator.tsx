"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/application/state/chatStore";
import { container } from "@/infrastructure/di/container";

/** SPEC-03: header avatar with the customer menu (orders, claims, logout). */
export function SesionIndicator() {
  const router = useRouter();
  const cliente = useChatStore((s) => s.cliente);
  const setAuthOpen = useChatStore((s) => s.setAuthOpen);
  const [abierto, setAbierto] = useState(false);

  if (!cliente) {
    return (
      <button onClick={() => setAuthOpen(true)}
        className="wf-btn px-4 py-2 text-[12px] font-bold bg-action-primary text-surface-ink">
        INICIAR SESIÓN
      </button>
    );
  }

  const inicial = (cliente.nombreCompleto?.charAt(0) ?? "C").toUpperCase();

  async function cerrarSesion() {
    setAbierto(false);
    await container.api.logout().catch(() => undefined);
    router.push("/");
  }

  return (
    <div className="relative">
      <button aria-label="Abrir menú de cuenta" onClick={() => setAbierto((v) => !v)}
        className="w-10 h-10 rounded-full bg-action-primary text-surface-ink font-bold flex items-center justify-center">
        {inicial}
      </button>
      {abierto && (
        <div className="absolute right-0 mt-2 w-48 rounded-md bg-white border border-border-default shadow-lg p-1 flex flex-col">
          <button onClick={() => { setAbierto(false); router.push("/pedidos"); }}
            className="text-left px-3 py-2 text-[13px] hover:bg-surface-cloud-subtle rounded-sm">
            Mis pedidos
          </button>
          <button onClick={() => { setAbierto(false); router.push("/pedidos/reclamos"); }}
            className="text-left px-3 py-2 text-[13px] hover:bg-surface-cloud-subtle rounded-sm">
            Mis reclamos
          </button>
          <button onClick={cerrarSesion}
            className="text-left px-3 py-2 text-[13px] text-error-default hover:bg-surface-cloud-subtle rounded-sm">
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
