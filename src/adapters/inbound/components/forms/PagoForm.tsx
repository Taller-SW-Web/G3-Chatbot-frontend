"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { detectarMarcaTarjeta, pagoSchema, type PagoInput } from "@/domain/schemas/pago.schema";

/** Keeps only 4 digits and inserts the slash: "1228" -> "12/28". A first digit above 1 becomes "0X". */
function formatearVencimiento(valor: string): string {
  let digitos = valor.replace(/\D/g, "");
  if (digitos[0] > "1") digitos = `0${digitos}`;
  digitos = digitos.slice(0, 4);
  return digitos.length > 2 ? `${digitos.slice(0, 2)}/${digitos.slice(2)}` : digitos;
}

/** Keeps only 16 digits, grouped by 4: "4111111111111111" -> "4111 1111 1111 1111". */
function formatearTarjeta(valor: string): string {
  return valor.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
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
    // handleSubmit runs on every keystroke; without this it focuses the first invalid field mid-typing.
    shouldFocusError: false,
  });

  const vencimientoField = register("vencimiento");
  const tarjetaField = register("tarjetaNum");
  const cvvField = register("cvv");
  const [marca, setMarca] = useState<string | null>(null);
  const numeroVal = watch("tarjetaNum") ?? "";

  useEffect(() => {
    setMarca(detectarMarcaTarjeta(numeroVal));
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
          {...tarjetaField}
          onChange={(e) => {
            e.target.value = formatearTarjeta(e.target.value);
            return tarjetaField.onChange(e);
          }}
          disabled={disabled}
          autoComplete="cc-number"
          inputMode="numeric"
          maxLength={19}
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
            {...vencimientoField}
            onChange={(e) => {
              e.target.value = formatearVencimiento(e.target.value);
              return vencimientoField.onChange(e);
            }}
            disabled={disabled}
            autoComplete="cc-exp"
            inputMode="numeric"
            maxLength={5}
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
            {...cvvField}
            onChange={(e) => {
              e.target.value = e.target.value.replace(/\D/g, "").slice(0, marca === "AMEX" ? 4 : 3);
              return cvvField.onChange(e);
            }}
            disabled={disabled}
            autoComplete="cc-csc"
            inputMode="numeric"
            maxLength={4}
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
