"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/domain/schemas/login.schema";

/** SPEC-01 */
export function LoginForm({ onOk }: { onOk: (d: LoginInput) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });
  return (
    <form onSubmit={handleSubmit(onOk)} className="flex flex-col gap-2">
      <input {...register("correo")} placeholder="Correo" aria-label="Correo" className="wf-input px-3 py-2.5 text-sm outline-none" />
      {errors.correo && <span className="text-[12px] text-error-default">{errors.correo.message}</span>}
      <input {...register("password")} type="password" placeholder="Contraseña" aria-label="Contraseña" className="wf-input px-3 py-2.5 text-sm outline-none" />
      <button type="submit" className="wf-btn py-3 text-[12px] font-bold bg-action-primary text-surface-ink">ENTRAR</button>
    </form>
  );
}
