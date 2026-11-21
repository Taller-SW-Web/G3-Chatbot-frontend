"use client";

import type { InputHTMLAttributes } from "react";

type OtpInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "inputMode" | "maxLength"> & {
  /** Marca el campo como inválido para lectores de pantalla. */
  invalid?: boolean;
};

/**
 * Campo de código OTP de 6 dígitos (SPEC-03, SPEC-04).
 *
 * Primitiva presentacional reutilizada por el MFA de inicio de sesión y por la
 * verificación del celular. No valida ni llama a la red: el formulario dueño
 * decide el envío.
 */
export function OtpInput({ invalid = false, className = "", ...props }: OtpInputProps) {
  return (
    <input
      {...props}
      type="text"
      inputMode="numeric"
      maxLength={6}
      pattern="[0-9]*"
      autoComplete={props.autoComplete ?? "one-time-code"}
      aria-invalid={invalid || props["aria-invalid"]}
      className={`wf-input px-3 py-2.5 text-sm text-center tracking-[0.3em] outline-none ${className}`}
    />
  );
}
