"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon } from "../components/icons";
import { ReclamoForm } from "../components/forms/ReclamoForm";

/**
 * `/reclamo`: formulario + constancia de éxito.
 * Registra solo con "Enviar reclamo" (SPEC-19). Paridad mockup.
 */
export function ReclamoPage() {
  const router = useRouter();
  const [codigo, setCodigo] = useState<string | null>(null);

  if (codigo) {
    return (
      <div className="p-6 flex flex-col items-center gap-3 text-center">
        <div className="wf-check w-16 h-16 rounded-full flex items-center justify-center bg-success-background text-success-default"><CheckIcon size={24} /></div>
        <h2 className="font-heading text-[24px] leading-8">¡SE REGISTRÓ TU RECLAMO!</h2>
        <p className="text-[14px] text-text-secondary">Código #{codigo} · Plazo de respuesta: 15 días hábiles.</p>
        <div className="rounded-md bg-white border border-border-default w-full p-3 text-[12px] text-text-secondary">Puedes hacerle seguimiento por el chat o en Historial de pedidos → Reclamos.</div>
        <button onClick={() => router.push("/pedidos/reclamos")} className="wf-btn w-full py-3 text-[12px] font-bold tracking-wide bg-action-primary text-surface-ink hover:bg-action-primary-hover">VER EN HISTORIAL</button>
        <button onClick={() => router.push("/chat/reclamo-defecto")} className="wf-btn w-full py-3 text-[12px] font-bold tracking-wide bg-surface-ink text-text-inverse">SEGUIR POR EL CHAT</button>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col gap-3">
      <ReclamoForm
        pedidoId="PED-2026-00891"
        onOk={() => setCodigo("REC-2026-0119")}
        onCancelar={() => router.push("/pedidos")}
      />
      <div className="rounded-md bg-white border border-border-default p-3 text-[12px] text-text-secondary">Constancia del reclamo · código + plazo de 15 días hábiles</div>
    </div>
  );
}
