"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  reclamoSchema,
  RECLAMO_MOTIVOS,
  RECLAMO_MOTIVO_VALUES,
  type ReclamoInput,
} from "@/modules/mod-postventa/domain/schemas/reclamo.schema";
import { FileAlertIcon } from "@/shared/ui/icons";

/**
 * SPEC-19: pedido, tipo, los 5 motivos de G5, descripción 20-1000, documento,
 * teléfono y solución esperada.
 */
export function ReclamoForm({
  pedidoId,
  documentoInicial = "",
  telefonoInicial = "",
  nombreInicial = "",
  emailInicial = "",
  tipoInicial,
  motivoInicial,
  descripcionInicial,
  solucionInicial,
  onOk,
  onCancelar,
}: {
  pedidoId: string;
  documentoInicial?: string;
  telefonoInicial?: string;
  nombreInicial?: string;
  emailInicial?: string;
  /** Valores que el chat puede precargar al abrir el formulario. */
  tipoInicial?: "RECLAMO" | "QUEJA";
  motivoInicial?: (typeof RECLAMO_MOTIVO_VALUES)[number];
  descripcionInicial?: string;
  solucionInicial?: string;
  onOk: (d: ReclamoInput) => void | Promise<void>;
  onCancelar: () => void;
}) {
  const { register, control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<ReclamoInput>({
    resolver: zodResolver(reclamoSchema),
    defaultValues: {
      pedidoId,
      tipo: tipoInicial ?? "RECLAMO",
      motivo: motivoInicial ?? "PRODUCTO_DEFECTUOSO_O_INCORRECTO",
      descripcion: descripcionInicial ?? undefined,
      nombre: nombreInicial || undefined,
      email: emailInicial || undefined,
      documento: documentoInicial,
      telefono: telefonoInicial,
      solucion: solucionInicial ?? undefined,
    },
  });
  const descripcion = watch("descripcion") ?? "";
  const tipo = watch("tipo");

  return (
    <form
      onSubmit={handleSubmit((d) => {
        const clean: ReclamoInput = { ...d };
        if (!clean.nombre?.trim()) delete (clean as Record<string, unknown>).nombre;
        if (!clean.email?.trim()) delete (clean as Record<string, unknown>).email;
        if (!clean.solucion?.trim()) delete (clean as Record<string, unknown>).solucion;
        return onOk(clean);
      })}
      className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-2"
    >
      <p className="font-heading text-[15px] tracking-[0.06em] uppercase text-text-primary">Crear reclamo · Pedido {pedidoId}</p>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex items-center gap-2 text-[13px]">
          <input type="radio" checked={tipo === "RECLAMO"} onChange={() => setValue("tipo", "RECLAMO")} /> Reclamo
        </label>
        <label className="flex items-center gap-2 text-[13px]">
          <input type="radio" checked={tipo === "QUEJA"} onChange={() => setValue("tipo", "QUEJA")} /> Queja
        </label>
      </div>
      <Controller
        control={control}
        name="motivo"
        defaultValue={motivoInicial ?? "PRODUCTO_DEFECTUOSO_O_INCORRECTO"}
        render={({ field }) => (
          <select
            {...field}
            ref={(node) => {
              field.ref(node);
              // React fija el value antes de montar los <option>; se re-aplica
              // en el ref (post-montaje) para que el prellenado sea visible.
              if (node && node.value !== String(field.value ?? "")) {
                node.value = String(field.value ?? "");
              }
            }}
            aria-label="Motivo del reclamo"
            className="wf-input px-3 py-2.5 text-sm"
          >
            {RECLAMO_MOTIVOS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        )}
      />
      <p className="text-[11px] text-text-secondary">
        Elige el motivo más cercano y cuéntanos lo ocurrido en la descripción.
      </p>
      <textarea {...register("descripcion")} placeholder="Describe lo ocurrido (20 a 1000 caracteres)..." aria-label="Descripción del reclamo" rows={4} maxLength={1000} className="wf-input px-3 py-2.5 text-sm outline-none" />
      <p className="text-[11px] text-text-secondary text-right">{descripcion.length}/1000</p>
      {errors.descripcion && <span className="text-[12px] text-error-default">{errors.descripcion.message}</span>}
      <input
        {...register("nombre")}
        placeholder="Nombre completo"
        aria-label="Nombre completo"
        className="wf-input px-3 py-2.5 text-sm outline-none"
      />
      <input
        {...register("email")}
        type="email"
        placeholder="Correo electrónico"
        aria-label="Correo electrónico"
        className="wf-input px-3 py-2.5 text-sm outline-none"
      />
      <input
        {...register("documento")}
        placeholder="Documento (prellenado)"
        aria-label="Documento"
        aria-invalid={Boolean(errors.documento)}
        aria-describedby={errors.documento ? "error-reclamo-documento" : undefined}
        className="wf-input px-3 py-2.5 text-sm outline-none"
      />
      {errors.documento && (
        <span id="error-reclamo-documento" role="alert" className="text-[12px] text-error-default">
          {errors.documento.message}
        </span>
      )}
      <input
        {...register("telefono")}
        placeholder="Teléfono de contacto"
        aria-label="Teléfono"
        aria-invalid={Boolean(errors.telefono)}
        aria-describedby={errors.telefono ? "error-reclamo-telefono" : undefined}
        className="wf-input px-3 py-2.5 text-sm outline-none"
      />
      {errors.telefono && (
        <span id="error-reclamo-telefono" role="alert" className="text-[12px] text-error-default">
          {errors.telefono.message}
        </span>
      )}
      <input {...register("solucion")} placeholder="¿Qué solución esperas?" aria-label="Solución esperada" className="wf-input px-3 py-2.5 text-sm outline-none" />
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onCancelar} className="wf-btn py-3 text-[12px] font-bold bg-white border border-border-default">CANCELAR</button>
        <button
          type="submit"
          disabled={descripcion.trim().length < 20 || isSubmitting}
          className="wf-btn py-3 text-[12px] font-bold bg-action-primary text-surface-ink disabled:opacity-45 inline-flex items-center justify-center gap-2"
        >
          <FileAlertIcon size={16} />{isSubmitting ? "ENVIANDO..." : "ENVIAR RECLAMO"}
        </button>
      </div>
    </form>
  );
}
