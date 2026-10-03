"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { pagoSchema, type PagoInput } from "@/domain/schemas/pago.schema";

/** SPEC-14 solo tarjeta, sin guardar PAN */
export function PagoForm({ onValid }: { onValid: (d: PagoInput) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<PagoInput>({
    resolver: zodResolver(pagoSchema),
  });
  return (
    <form onChange={handleSubmit(onValid)} onSubmit={(e) => e.preventDefault()}
      className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-2">
      <p className="font-heading text-[15px] uppercase">Método de pago · solo tarjeta</p>
      <input {...register("tarjetaNum")} placeholder="Número de tarjeta" inputMode="numeric" aria-label="Número de tarjeta" className="wf-input px-3 py-2.5 text-sm outline-none" />
      {errors.tarjetaNum && <span className="text-[12px] text-error-default">{errors.tarjetaNum.message as string}</span>}
      <div className="grid grid-cols-2 gap-2">
        <input {...register("vencimiento")} placeholder="MM/AA" aria-label="Vencimiento MM/AA" className="wf-input px-3 py-2.5 text-sm outline-none" />
        <input {...register("cvv")} placeholder="CVV" inputMode="numeric" aria-label="CVV" className="wf-input px-3 py-2.5 text-sm outline-none" />
      </div>
    </form>
  );
}
