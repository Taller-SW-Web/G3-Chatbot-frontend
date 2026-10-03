"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { direccionSchema, type DireccionInput } from "@/domain/schemas/direccion.schema";
import { DISTRITOS } from "@/adapters/outbound/mockData";

/** SPEC-12,14 documento A14 */
export function DireccionForm({ onValid }: { onValid: (d: DireccionInput) => void }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<DireccionInput>({
    resolver: zodResolver(direccionSchema),
    defaultValues: { docTipo: "DNI" },
  });
  const docTipo = watch("docTipo");
  return (
    <form onChange={handleSubmit(onValid)} onSubmit={(e) => e.preventDefault()}
      className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-2">
      <p className="font-heading text-[15px] uppercase">Dirección de envío</p>
      <input {...register("nombre")} placeholder="Nombre completo" aria-label="Nombre completo" className="wf-input px-3 py-2.5 text-sm outline-none" />
      <input {...register("direccion")} placeholder="Dirección exacta" aria-label="Dirección exacta" className="wf-input px-3 py-2.5 text-sm outline-none" />
      <select {...register("distrito")} aria-label="Distrito de entrega" className="wf-input px-2 py-2.5 text-sm">
        <option value="">Distrito</option>
        {DISTRITOS.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>
      {errors.distrito && <span className="text-[12px] text-error-default">{errors.distrito.message}</span>}
      <input {...register("referencia")} placeholder="Referencia (Opcional)" aria-label="Referencia opcional" className="wf-input px-3 py-2.5 text-sm outline-none" />
      <div className="grid grid-cols-2 gap-2">
        <select {...register("docTipo")} aria-label="Tipo de documento" className="wf-input px-2 py-2.5 text-sm">
          <option>DNI</option><option>RUC</option><option>CE</option><option>PASAPORTE</option>
        </select>
        <input {...register("docNum")} placeholder={docTipo === "DNI" ? "8 dígitos" : "N° documento"} aria-label="Número de documento" className="wf-input px-3 py-2.5 text-sm outline-none" />
      </div>
      {errors.docNum && <span className="text-[12px] text-error-default">{errors.docNum.message}</span>}
    </form>
  );
}
