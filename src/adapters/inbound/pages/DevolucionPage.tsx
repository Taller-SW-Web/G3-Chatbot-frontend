"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon } from "../components/icons";
import { DevolucionForm } from "../components/forms/DevolucionForm";

/**
 * `/devolucion`: solicitud de cambio/devolución + constancia de éxito.
 * La evidencia se sube desde el formulario (SPEC-21). Paridad mockup.
 */
export function DevolucionPage() {
  const router = useRouter();
  const [codigo, setCodigo] = useState<string | null>(null);

  if (codigo) {
    return (
      <div className="p-6 flex flex-col items-center gap-3 text-center">
        <div className="wf-check w-16 h-16 rounded-full flex items-center justify-center bg-success-background text-success-default"><CheckIcon size={24} /></div>
        <h2 className="font-heading text-[24px] leading-8">¡SOLICITUD ENVIADA!</h2>
        <p className="text-[14px] text-text-secondary">Código {codigo} · La evidencia quedó adjunta.</p>
        <div className="rounded-md bg-white border border-border-default w-full p-3 text-[12px] text-text-secondary">Puedes hacerle seguimiento por el chat o en Historial de pedidos → Reembolso/Cambio.</div>
        <button onClick={() => router.push("/pedidos/reembolso")} className="wf-btn w-full py-3 text-[12px] font-bold tracking-wide bg-action-primary text-surface-ink hover:bg-action-primary-hover">VER EN HISTORIAL</button>
        <button onClick={() => router.push("/chat/devolucion-compra")} className="wf-btn w-full py-3 text-[12px] font-bold tracking-wide bg-surface-ink text-text-inverse">SEGUIR POR EL CHAT</button>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col gap-3">
      <p className="font-heading text-[15px] tracking-[0.06em] uppercase text-text-primary">Solicitar devolución / cambio · PED-2026-00891</p>
      <DevolucionForm
        lineas={["Zapatilla Runner Talla 41 · Blanco", "Zapatilla Urban Talla 42 · Negro"]}
        onOk={() => setCodigo("DEV-2026-00046")}
        onCancelar={() => router.push("/pedidos")}
      />
    </div>
  );
}
