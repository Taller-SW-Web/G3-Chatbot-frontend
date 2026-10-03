"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, LockIcon } from "../components/icons";
import { OtpCelularForm } from "../components/forms/OtpCelularForm";
import { useChatStore } from "@/application/state/chatStore";
import { validarContactoUseCase } from "@/application/use_cases/validarContactoUseCase";
import { container } from "@/infrastructure/di/container";

/**
 * `/cuenta`: datos de sesión, verificación de celular (SPEC-04),
 * accesos a pedidos/reclamos/sugerencias y cierre de sesión.
 * Paridad con Mockups-Wireframes.
 */
export function MiCuentaPage() {
  const router = useRouter();
  const cliente = useChatStore((s) => s.cliente);
  const setCliente = useChatStore((s) => s.setCliente);
  const logout = useChatStore((s) => s.logout);
  const [otp, setOtp] = useState(false);
  const [enviado, setEnviado] = useState(false);

  if (!cliente) {
    return (
      <div className="p-6 flex flex-col items-center gap-3 text-center">
        <p className="text-[14px] text-text-secondary">Inicia sesión para ver tu cuenta.</p>
        <button onClick={() => router.push("/")} className="wf-btn w-full py-3 text-[12px] font-bold bg-action-primary text-surface-ink">VOLVER AL INICIO</button>
      </div>
    );
  }

  async function verificar(codigo: string) {
    if (!cliente) return;
    const r = await validarContactoUseCase(container.api, codigo);
    if (r.verificado) setCliente({ ...cliente, celularVerificado: true });
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <p className="font-heading text-[15px] tracking-[0.06em] uppercase text-text-primary">Mi cuenta</p>
      <div className="rounded-md bg-white border border-border-default divide-y divide-surface-cloud-subtle">
        <div className="flex justify-between gap-2 px-3 py-2.5 text-[14px]"><span className="text-text-secondary">Nombre completo</span><span className="font-bold text-right">{cliente.nombreCompleto}</span></div>
        <div className="flex justify-between items-center gap-2 px-3 py-2.5 text-[14px]"><span className="text-text-secondary">Correo</span><span className="font-bold text-right">{cliente.correo} <span className="inline-flex items-center gap-1 rounded-full bg-accent-volt-soft text-accent-volt-ink text-[10px] font-bold px-2 py-0.5 ml-1"><CheckIcon size={16} />Verificado</span></span></div>
        <div className="flex justify-between items-center gap-2 px-3 py-2.5 text-[14px]"><span className="text-text-secondary">Celular</span><span className="font-bold text-right">{cliente.celularEnmascarado} <span className={`inline-flex items-center gap-1 rounded-full text-[10px] font-bold px-2 py-0.5 ml-1 ${cliente.celularVerificado ? "bg-accent-volt-soft text-accent-volt-ink" : "bg-action-primary-soft text-ember-deep"}`}>{cliente.celularVerificado ? "Celular verificado" : "Sin verificar"}</span></span></div>
        <div className="flex justify-between gap-2 px-3 py-2.5 text-[14px]"><span className="text-text-secondary">Documento</span><span className="font-bold">{cliente.tipoDocumento} {cliente.documentoEnmascarado}</span></div>
      </div>

      {!cliente.celularVerificado && (
        !otp ? (
          <button onClick={() => setOtp(true)} className="wf-btn py-3 text-[12px] font-bold tracking-wide bg-surface-ink text-text-inverse">VERIFICAR CELULAR</button>
        ) : !enviado ? (
          <div className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-2">
            <p className="text-[14px] font-bold">Para coordinar la entrega necesitamos confirmar tu celular {cliente.celularEnmascarado}</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setEnviado(true)} className="wf-btn py-3 text-[12px] font-bold bg-action-primary text-surface-ink">ENVIAR CÓDIGO</button>
              <button className="wf-btn py-3 text-[12px] font-bold bg-white border border-border-default">ESE NO ES MI NÚMERO</button>
            </div>
          </div>
        ) : (
          <div className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-2">
            <p className="text-[14px] font-bold">Ingresa el código de 6 dígitos</p>
            <p className="text-[12px] text-text-secondary">5:00 · <button className="underline">Enviar otro código</button></p>
            <OtpCelularForm onOk={verificar} />
          </div>
        )
      )}

      <div className="flex flex-col gap-2">
        <button onClick={() => router.push("/pedidos")} className="wf-btn py-3 text-[12px] font-bold tracking-wide bg-white border border-border-default text-text-primary">MIS PEDIDOS</button>
        <button onClick={() => router.push("/pedidos/reclamos")} className="wf-btn py-3 text-[12px] font-bold tracking-wide bg-white border border-border-default text-text-primary">MIS RECLAMOS</button>
        <button onClick={() => router.push("/sugerencias")} className="wf-btn py-3 text-[12px] font-bold tracking-wide bg-surface-ink text-text-inverse">ENVIAR SUGERENCIA / REPORTAR BUG</button>
        <button onClick={() => { logout(); router.push("/"); }} className="wf-btn py-3 text-[12px] font-bold tracking-wide bg-white border border-border-default text-error-default">CERRAR SESIÓN</button>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-[11px] tracking-[0.18em] text-text-secondary font-bold">SE EDITA EN SEGURIDAD / MARKETPLACE</p>
        {["Nombre o correo", "Cambiar celular", "Contraseña y MFA", "Direcciones guardadas"].map((t) => (
          <div key={t} className="flex items-center justify-between bg-white border border-border-default rounded-sm px-3 py-2.5 text-[14px]">
            <span>{t}</span><LockIcon size={16} />
          </div>
        ))}
      </div>
    </div>
  );
}
