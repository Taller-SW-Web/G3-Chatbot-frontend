"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { pagoSchema, type PagoInput } from "@/domain/schemas/pago.schema";

function detectarMarca(numero: string): string | null {
  const clean = numero.replace(/\D/g, "");
  if (clean.startsWith("4")) return "VISA";
  if (clean.startsWith("34") || clean.startsWith("37")) return "AMEX";
  const p2 = parseInt(clean.slice(0, 2), 10);
  const p4 = parseInt(clean.slice(0, 4), 10);
  if ((p2 >= 51 && p2 <= 55) || (p4 >= 2221 && p4 <= 2720)) return "MASTERCARD";
  return null;
}

/** SPEC-14: Captura segura de tarjeta (solo en memoria local, sin persistir PAN ni CVV). */
export function PagoForm({
  onValid,
  disabled = false,
}: {
  onValid: (d: PagoInput | null) => void;
  disabled?: boolean;
}) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PagoInput>({
    resolver: zodResolver(pagoSchema),
    mode: "onChange",
  });

  const [marca, setMarca] = useState<string | null>(null);
  const numeroVal = watch("tarjetaNum") ?? "";

  useEffect(() => {
    setMarca(detectarMarca(numeroVal));
  }, [numeroVal]);

  // Limpiar campos sensibles al desmontar
  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  return (
    <form
      onChange={handleSubmit(
        (data) => onValid(data),
        () => onValid(null)
      )}
      onSubmit={(e) => e.preventDefault()}
      className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-2.5"
    >
      <div className="flex justify-between items-center">
        <p className="font-heading text-[14px] uppercase tracking-wide">Método de pago · solo tarjeta</p>
        {marca && (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-surface-ink text-text-inverse tracking-wider">
            {marca}
          </span>
        )}
      </div>

      <div>
        <input
          {...register("titular")}
          disabled={disabled}
          autoComplete="cc-name"
          placeholder="Nombre del titular de la tarjeta"
          aria-label="Titular de la tarjeta"
          className="wf-input w-full px-3 py-2.5 text-sm outline-none border border-border-default rounded"
        />
        {errors.titular && (
          <span className="text-[12px] text-error-default mt-0.5 block">{errors.titular.message}</span>
        )}
      </div>

      <div>
        <input
          {...register("tarjetaNum")}
          disabled={disabled}
          autoComplete="cc-number"
          inputMode="numeric"
          placeholder="Número de tarjeta (ej. 4111 1111 1111 1111)"
          aria-label="Número de tarjeta"
          className="wf-input w-full px-3 py-2.5 text-sm outline-none border border-border-default rounded"
        />
        {errors.tarjetaNum && (
          <span className="text-[12px] text-error-default mt-0.5 block">{errors.tarjetaNum.message}</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <input
            {...register("vencimiento")}
            disabled={disabled}
            autoComplete="cc-exp"
            placeholder="MM/AA"
            aria-label="Vencimiento MM/AA"
            className="wf-input w-full px-3 py-2.5 text-sm outline-none border border-border-default rounded"
          />
          {errors.vencimiento && (
            <span className="text-[12px] text-error-default mt-0.5 block">{errors.vencimiento.message}</span>
          )}
        </div>
        <div>
          <input
            {...register("cvv")}
            disabled={disabled}
            autoComplete="cc-csc"
            inputMode="numeric"
            placeholder={marca === "AMEX" ? "CVV (4 dígitos)" : "CVV (3 dígitos)"}
            aria-label="CVV"
            className="wf-input w-full px-3 py-2.5 text-sm outline-none border border-border-default rounded"
          />
          {errors.cvv && (
            <span className="text-[12px] text-error-default mt-0.5 block">{errors.cvv.message}</span>
          )}
        </div>
      </div>
    </form>
  );
}
