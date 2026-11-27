"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/modules/mod-auth/domain/schemas/login.schema";
import { PasswordVisibilityButton } from "@/modules/mod-auth/ui/forms/PasswordVisibilityButton";

/** SPEC-03 Req. 1: email + password with generic errors and helper links. */
export function LoginForm({
  onOk,
  onReenviar,
  correoInicial,
  error,
  cargando,
  urlRecuperacion = process.env.NEXT_PUBLIC_RECUPERAR_PASSWORD_URL || "https://seguridad.marketplace.com/recuperar-password",
}: {
  onOk: (d: LoginInput) => void;
  onReenviar?: () => void;
  correoInicial?: string;
  error?: string | null;
  cargando?: boolean;
  urlRecuperacion?: string;
}) {
  const [verContrasena, setVerContrasena] = useState(false);
  const {
    register,
    handleSubmit,
    resetField,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { correo: correoInicial ?? "", password: "" },
  });

  // Al recibir error de login (401 credenciales inválidas), se limpia el campo contraseña (SPEC-03)
  useEffect(() => {
    if (error) {
      resetField("password");
    }
  }, [error, resetField]);

  return (
    <form onSubmit={handleSubmit(onOk)} className="flex flex-col gap-2.5 screen-enter">
      <input
        {...register("correo")}
        placeholder="tucorreo@ejemplo.com"
        aria-label="Correo"
        autoComplete="email"
        aria-invalid={!!errors.correo}
        aria-describedby={errors.correo ? "correo-login-error" : undefined}
        className="wf-input px-3 py-2.5 text-sm outline-none border border-border-default rounded-sm transition-all duration-150 focus:border-accent-signal focus:ring-1 focus:ring-accent-signal/20"
      />
      {errors.correo && (
        <span id="correo-login-error" className="text-[12px] text-error-default">
          {errors.correo.message}
        </span>
      )}
      <div className="relative">
        <input
          {...register("password")}
          type={verContrasena ? "text" : "password"}
          placeholder="********"
          aria-label="Contraseña"
          autoComplete="current-password"
          className="wf-input w-full px-3 py-2.5 pr-12 text-sm outline-none border border-border-default rounded-sm transition-all duration-150 focus:border-accent-signal focus:ring-1 focus:ring-accent-signal/20"
        />
        <PasswordVisibilityButton visible={verContrasena} onToggle={() => setVerContrasena((v) => !v)} />
      </div>
      {error && (
        <p role="alert" className="text-[12px] text-error-default">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={cargando}
        className="wf-btn py-3 text-[12px] font-bold bg-action-primary text-surface-ink hover:bg-action-primary-hover active:scale-[0.98] transition-all duration-150 shadow-sm disabled:opacity-60"
      >
        {cargando ? "INGRESANDO…" : "ENTRAR"}
      </button>
      <div className="flex flex-col gap-1 text-left">
        <a
          href={urlRecuperacion}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[12px] font-semibold underline text-text-secondary text-left inline-block"
        >
          ¿Olvidaste tu contraseña?
        </a>
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
