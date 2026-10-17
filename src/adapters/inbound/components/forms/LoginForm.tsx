"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/domain/schemas/login.schema";

/** SPEC-03 Req. 1: email + password with generic errors and helper links. */
export function LoginForm({
  onOk,
  onReenviar,
  correoInicial,
  error,
  cargando,
}: {
  onOk: (d: LoginInput) => void;
  onReenviar?: () => void;
  correoInicial?: string;
  error?: string | null;
  cargando?: boolean;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { correo: correoInicial ?? "" },
  });
  return (
    <form onSubmit={handleSubmit(onOk)} className="flex flex-col gap-2">
      <input {...register("correo")} placeholder="Correo" aria-label="Correo"
        autoComplete="email" aria-invalid={!!errors.correo}
        aria-describedby={errors.correo ? "correo-login-error" : undefined}
        className="wf-input px-3 py-2.5 text-sm outline-none" />
      {errors.correo && <span id="correo-login-error" className="text-[12px] text-error-default">{errors.correo.message}</span>}
      <input {...register("password")} type="password" placeholder="Contraseña"
        aria-label="Contraseña" autoComplete="current-password"
        className="wf-input px-3 py-2.5 text-sm outline-none" />
      {error && (
        <p role="alert" className="text-[12px] text-error-default">{error}</p>
      )}
      <button type="submit" disabled={cargando}
        className="wf-btn py-3 text-[12px] font-bold bg-action-primary text-surface-ink disabled:opacity-60">
        {cargando ? "INGRESANDO…" : "ENTRAR"}
      </button>
      <div className="flex flex-col gap-1 text-left">
        <button type="button" className="text-[12px] font-semibold underline text-text-secondary text-left">
          ¿Olvidaste tu contraseña?
        </button>
        <button
          type="button"
          onClick={onReenviar}
          className="text-[12px] font-semibold underline text-text-secondary text-left"
        >
          ¿No verificaste tu correo? Reenviar verificación
        </button>
      </div>
    </form>
  );
}
