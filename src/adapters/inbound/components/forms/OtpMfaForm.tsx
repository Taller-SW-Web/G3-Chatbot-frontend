"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { otpMfaSchema } from "@/domain/schemas/otpMfa.schema";
import { maskCelular, maskEmail } from "@/domain/utils/sanitize";

const CODE_TTL_SECONDS = 5 * 60;

/** SPEC-03 Req. 2: 6-digit code with countdown, resend timer and channel switch. */
export function OtpMfaForm({
  canal,
  contacto,
  onOk,
  onReenviar,
  onCambiarCanal,
  error,
  cargando,
}: {
  canal: "EMAIL" | "SMS";
  contacto: string;
  onOk: (codigo: string) => void;
  onReenviar: () => void;
  onCambiarCanal: () => void;
  error?: string | null;
  cargando?: boolean;
}) {
  const { register, handleSubmit, reset } = useForm({ resolver: zodResolver(otpMfaSchema) });
  const [restantes, setRestantes] = useState(CODE_TTL_SECONDS);

  useEffect(() => {
    if (restantes <= 0) return;
    const t = setTimeout(() => setRestantes((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [restantes]);

  const mm = String(Math.floor(restantes / 60));
  const ss = String(restantes % 60).padStart(2, "0");
  const destino = canal === "EMAIL" ? maskEmail(contacto) : maskCelular(contacto);

  return (
    <form onSubmit={handleSubmit((d) => { onOk(d.codigo); reset(); })}
      className="flex flex-col gap-2">
      <p className="text-[13px] text-text-secondary">
        Enviamos un código a {destino} · {mm}:{ss}
      </p>
      <input {...register("codigo")} inputMode="numeric" maxLength={6} placeholder="••••••"
        aria-label="Código MFA 6 dígitos" autoComplete="one-time-code"
        className="wf-input px-3 py-2.5 text-sm text-center tracking-[0.3em] outline-none" />
      {error && (
        <p role="alert" className="text-[12px] text-error-default">{error}</p>
      )}
      <button type="submit" disabled={cargando || restantes <= 0}
        className="wf-btn py-3 text-[12px] font-bold bg-action-primary text-surface-ink disabled:opacity-60">
        {cargando ? "VERIFICANDO…" : "VERIFICAR MFA"}
      </button>
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => { onReenviar(); setRestantes(CODE_TTL_SECONDS); }}
          className="text-[12px] font-semibold underline text-text-secondary">
          Reenviar código
        </button>
        <button type="button" onClick={onCambiarCanal}
          className="text-[12px] font-semibold underline text-text-secondary">
          {canal === "EMAIL" ? "Enviar por SMS" : "Enviar por correo"}
        </button>
      </div>
    </form>
  );
}
