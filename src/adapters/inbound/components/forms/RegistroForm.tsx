"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registroSchema, type RegistroInput } from "@/domain/schemas/registro.schema";

/** 8 formularios seguros RHF+Zod, nunca pasan por LLM. SPEC-01 */
export function RegistroForm({ onOk }: { onOk: (d: RegistroInput) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<RegistroInput>({
    resolver: zodResolver(registroSchema),
  });
  return (
    <form onSubmit={handleSubmit(onOk)} className="flex flex-col gap-2">
      <input {...register("nombre")} placeholder="Nombre completo" aria-label="Nombre completo" className="wf-input px-3 py-2.5 text-sm outline-none" />
      {errors.nombre && <span className="text-[12px] text-error-default">{errors.nombre.message}</span>}
      <input {...register("correo")} placeholder="Correo" aria-label="Correo" className="wf-input px-3 py-2.5 text-sm outline-none" />
      {errors.correo && <span className="text-[12px] text-error-default">{errors.correo.message}</span>}
      <input {...register("password")} type="password" placeholder="Contraseña" aria-label="Contraseña" className="wf-input px-3 py-2.5 text-sm outline-none" />
      <input {...register("confirmar")} type="password" placeholder="Confirmar contraseña" aria-label="Confirmar contraseña" className="wf-input px-3 py-2.5 text-sm outline-none" />
      {errors.confirmar && <span className="text-[12px] text-error-default">{errors.confirmar.message}</span>}
      <button type="submit" className="wf-btn py-3 text-[12px] font-bold bg-action-primary text-surface-ink">REGISTRARSE</button>
    </form>
  );
}
