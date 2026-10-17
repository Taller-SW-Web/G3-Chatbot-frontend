"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  reenvioVerificacionSchema,
  type ReenvioVerificacionInput,
} from "@/domain/schemas/reenvioVerificacion.schema";

/**
 * SPEC-02 Req. 2: reenvío del enlace, reutilizable en la página, el chat y el login.
 * El mensaje de éxito es siempre neutro; nunca confirma que la cuenta exista.
 */
export function ReenviarVerificacionForm({
  correoInicial,
  onEnviar,
  mensaje,
  error,
  cargando,
}: {
  correoInicial?: string;
  onEnviar: (correo: string) => void;
  mensaje?: string | null;
  error?: string | null;
  cargando?: boolean;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ReenvioVerificacionInput>({
    resolver: zodResolver(reenvioVerificacionSchema),
    defaultValues: { correo: correoInicial ?? "" },
  });

  useEffect(() => {
    if (correoInicial) setValue("correo", correoInicial);
  }, [correoInicial, setValue]);

  return (
    <form onSubmit={handleSubmit((d) => onEnviar(d.correo))} className="flex flex-col gap-2" noValidate>
      <label htmlFor="reenvio-correo" className="text-[12px] font-semibold text-text-primary">
        Correo
      </label>
      <input
        id="reenvio-correo"
        type="email"
        {...register("correo")}
        autoComplete="email"
        aria-invalid={!!errors.correo}
        className="wf-input px-3 py-2.5 text-sm outline-none border border-border-default rounded-sm"
      />
      {errors.correo && <span className="text-[12px] text-error-default">{errors.correo.message}</span>}
      {mensaje && (
        <p role="status" className="text-[12px] text-success-default">
          {mensaje}
        </p>
      )}
      {error && (
        <p role="alert" className="text-[12px] text-error-default">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={cargando}
        className="wf-btn py-3 text-[12px] font-bold bg-action-primary text-surface-ink disabled:opacity-60"
      >
        {cargando ? "ENVIANDO…" : "ENVIARME UN ENLACE NUEVO"}
      </button>
    </form>
  );
}
