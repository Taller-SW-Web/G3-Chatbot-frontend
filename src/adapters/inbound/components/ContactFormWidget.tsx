"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { otpCelularSchema } from "@/domain/schemas/otpCelular.schema";

/** Widget contacto: OTP celular 6 dígitos. Nunca pasa por LLM. */
export function ContactFormWidget({
  onVerificado,
}: {
  onVerificado: () => void;
}) {
  const { register, handleSubmit } = useForm({
    resolver: zodResolver(otpCelularSchema),
  });
  return (
    <form
      onSubmit={handleSubmit(() => onVerificado())}
      className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-2"
    >
      <p className="text-[14px] font-bold">Verificación del celular · 6 dígitos</p>
      <input
        {...register("codigo")}
        inputMode="numeric"
        maxLength={6}
        placeholder="123456"
        aria-label="Código de 6 dígitos"
        className="wf-input px-3 py-2.5 text-sm outline-none text-center tracking-[0.3em]"
      />
      <button
        type="submit"
        className="wf-btn py-3 text-[12px] font-bold tracking-wide bg-action-primary text-surface-ink"
      >
        VERIFICAR
      </button>
    </form>
  );
}
