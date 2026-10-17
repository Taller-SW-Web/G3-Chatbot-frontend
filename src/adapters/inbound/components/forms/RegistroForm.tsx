"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  normalizarCelular,
  crearRegistroSchema,
  type RegistroInput,
} from "@/domain/schemas/registro.schema";
import {
  POLITICA_POR_DEFECTO,
  type PoliticaContrasena,
} from "@/domain/utils/passwordPolicy";
import { PasswordPolicyChecklist } from "./PasswordPolicyChecklist";

/**
 * SPEC-01 Req. 1/2: formulario seguro (RHF + Zod), nunca pasa por el LLM.
 * Normaliza el celular al perder el foco y muestra la política en tiempo real.
 */
export function RegistroForm({
  onOk,
  politica,
  error,
  erroresCampo,
  cargando,
  onIniciarSesion,
}: {
  onOk: (d: RegistroInput) => void;
  politica?: PoliticaContrasena;
  error?: string | null;
  erroresCampo?: Partial<Record<keyof RegistroInput, string>>;
  cargando?: boolean;
  /** Shown when the email is already taken (SPEC-01 "Correo no disponible"). */
  onIniciarSesion?: () => void;
}) {
  const schema = useMemo(() => crearRegistroSchema(politica), [politica]);
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    resetField,
    watch,
    formState: { errors },
  } = useForm<RegistroInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombres: "",
      apellidos: "",
      correo: "",
      celular: "",
      contrasena: "",
      confirmar: "",
      aceptaTerminos: undefined as unknown as true,
    },
  });
  const [verContrasena, setVerContrasena] = useState(false);
  const contrasena = watch("contrasena") ?? "";

  // After a failed submit keep the entered values but clear both passwords (SPEC-01 Req. 4).
  useEffect(() => {
    if (!error && !erroresCampo) return;
    resetField("contrasena", { defaultValue: "" });
    resetField("confirmar", { defaultValue: "" });
  }, [error, erroresCampo, resetField]);

  // Errores por campo que devuelve el BFF (`400 VALIDACION`, `422 POLITICA_INCUMPLIDA`).
  useEffect(() => {
    if (!erroresCampo) return;
    (Object.keys(erroresCampo) as Array<keyof RegistroInput>).forEach((campo) => {
      const mensaje = erroresCampo[campo];
      if (mensaje) setError(campo, { type: "server", message: mensaje });
    });
  }, [erroresCampo, setError]);

  const campoTexto =
    "wf-input px-3 py-2.5 text-sm outline-none border border-border-default rounded-sm";
  const celular = register("celular");

  return (
    <form onSubmit={handleSubmit(onOk)} className="flex flex-col gap-2" noValidate>
      <label htmlFor="reg-nombres" className="text-[12px] font-semibold text-text-primary">
        Nombres
      </label>
      <input
        id="reg-nombres"
        {...register("nombres")}
        autoComplete="given-name"
        aria-invalid={!!errors.nombres}
        className={campoTexto}
      />
      {errors.nombres && <span className="text-[12px] text-error-default">{errors.nombres.message}</span>}

      <label htmlFor="reg-apellidos" className="text-[12px] font-semibold text-text-primary">
        Apellidos
      </label>
      <input
        id="reg-apellidos"
        {...register("apellidos")}
        autoComplete="family-name"
        aria-invalid={!!errors.apellidos}
        className={campoTexto}
      />
      {errors.apellidos && <span className="text-[12px] text-error-default">{errors.apellidos.message}</span>}

      <label htmlFor="reg-correo" className="text-[12px] font-semibold text-text-primary">
        Correo
      </label>
      <input
        id="reg-correo"
        type="email"
        {...register("correo")}
        placeholder="tucorreo@ejemplo.com"
        autoComplete="email"
        aria-invalid={!!errors.correo}
        className={campoTexto}
      />
      {errors.correo && <span className="text-[12px] text-error-default">{errors.correo.message}</span>}

      <label htmlFor="reg-celular" className="text-[12px] font-semibold text-text-primary">
        Celular
      </label>
      <input
        id="reg-celular"
        {...celular}
        onBlur={(e) => {
          celular.onBlur(e);
          setValue("celular", normalizarCelular(e.target.value), { shouldValidate: true });
        }}
        placeholder="987654321"
        inputMode="tel"
        autoComplete="tel"
        aria-invalid={!!errors.celular}
        className={campoTexto}
      />
      {errors.celular && <span className="text-[12px] text-error-default">{errors.celular.message}</span>}

      <label htmlFor="reg-contrasena" className="text-[12px] font-semibold text-text-primary">
        Contraseña
      </label>
      <div className="relative">
        <input
          id="reg-contrasena"
          type={verContrasena ? "text" : "password"}
          {...register("contrasena")}
          autoComplete="new-password"
          aria-invalid={!!errors.contrasena}
          aria-describedby="reg-politica"
          className={`${campoTexto} w-full pr-16`}
        />
        <button
          type="button"
          onClick={() => setVerContrasena((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-semibold underline text-text-secondary"
        >
          {verContrasena ? "Ocultar" : "Ver"}
        </button>
      </div>
      {errors.contrasena && <span className="text-[12px] text-error-default">{errors.contrasena.message}</span>}
      <PasswordPolicyChecklist politica={politica ?? POLITICA_POR_DEFECTO} valor={contrasena} id="reg-politica" />

      <label htmlFor="reg-confirmar" className="text-[12px] font-semibold text-text-primary">
        Confirmar contraseña
      </label>
      <input
        id="reg-confirmar"
        type="password"
        {...register("confirmar")}
        autoComplete="new-password"
        aria-invalid={!!errors.confirmar}
        className={campoTexto}
      />
      {errors.confirmar && <span className="text-[12px] text-error-default">{errors.confirmar.message}</span>}

      <label htmlFor="reg-terminos" className="flex items-start gap-2 text-[12px] text-text-secondary">
        <input id="reg-terminos" type="checkbox" {...register("aceptaTerminos")} className="mt-0.5" />
        <span>
          Acepto los{" "}
          <a href="/terminos" className="underline text-text-primary">
            términos y condiciones
          </a>
        </span>
      </label>
      {errors.aceptaTerminos && (
        <span className="text-[12px] text-error-default">{errors.aceptaTerminos.message}</span>
      )}

      {error && (
        <p role="alert" className="text-[12px] text-error-default">
          {error}
        </p>
      )}
      {onIniciarSesion && (
        <button
          type="button"
          onClick={onIniciarSesion}
          className="self-start text-[12px] font-semibold underline text-text-primary"
        >
          Iniciar sesión
        </button>
      )}

      <button
        type="submit"
        disabled={cargando}
        className="wf-btn py-3 text-[12px] font-bold bg-action-primary text-surface-ink disabled:opacity-60"
      >
        {cargando ? "CREANDO CUENTA…" : "REGISTRARSE"}
      </button>
    </form>
  );
}
