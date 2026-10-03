"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { otpMfaSchema } from "@/domain/schemas/otpMfa.schema";

/** SPEC-03 */
export function OtpMfaForm({ onOk }: { onOk: (codigo: string) => void }) {
  const { register, handleSubmit } = useForm({ resolver: zodResolver(otpMfaSchema) });
  return (
    <form onSubmit={handleSubmit((d) => onOk(d.codigo))} className="flex flex-col gap-2">
      <input {...register("codigo")} inputMode="numeric" maxLength={6} placeholder="••••••"
        aria-label="Código MFA 6 dígitos" className="wf-input px-3 py-2.5 text-sm text-center tracking-[0.3em] outline-none" />
      <button type="submit" className="wf-btn py-3 text-[12px] font-bold bg-action-primary text-surface-ink">VERIFICAR MFA</button>
    </form>
  );
}
