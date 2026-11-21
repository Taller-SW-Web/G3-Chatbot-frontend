"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { OtpInput } from "@/shared/ui/OtpInput";
import { normalizarCodigoOtp } from "@/shared/auth/otpCelular";
import { otpCelularSchema } from "@/modules/mod-auth/domain/schemas/otpCelular.schema";

/** SPEC-04: formulario mínimo del código; el flujo completo vive en `OtpCelularFlow`. */
export function OtpCelularForm({ onOk }: { onOk: (codigo: string) => void }) {
  const { register, handleSubmit, setValue } = useForm({
    resolver: zodResolver(otpCelularSchema),
    defaultValues: { codigo: "" },
  });
  const codigo = register("codigo");

  return (
    <form onSubmit={handleSubmit((d) => onOk(d.codigo))} className="flex flex-col gap-2">
      <p className="text-[14px] font-bold">Verificación del celular · 6 dígitos</p>
      <OtpInput
        {...codigo}
        onChange={(e) => {
          setValue("codigo", normalizarCodigoOtp(e.target.value), { shouldValidate: true });
        }}
        placeholder="••••••"
        aria-label="Código celular 6 dígitos"
      />
      <button type="submit" className="wf-btn py-3 text-[12px] font-bold bg-action-primary text-surface-ink">
        VERIFICAR
      </button>
    </form>
  );
}
