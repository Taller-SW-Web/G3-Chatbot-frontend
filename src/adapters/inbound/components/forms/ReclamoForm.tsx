"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { reclamoSchema, RECLAMO_MOTIVOS, type ReclamoInput } from "@/domain/schemas/reclamo.schema";
import { FileAlertIcon } from "../icons";

/** SPEC-19: pedido, tipo, 8 motivos, descripción 20-1000, documento, solución. */
export function ReclamoForm({
  pedidoId,
  onOk,
  onCancelar,
}: {
  pedidoId: string;
  onOk: (d: ReclamoInput) => void;
  onCancelar: () => void;
}) {
  const [tipo, setTipo] = useState<"RECLAMO" | "QUEJA">("RECLAMO");
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ReclamoInput>({
    resolver: zodResolver(reclamoSchema),
    defaultValues: { pedidoId, tipo: "RECLAMO", motivo: "Producto defectuoso" },
  });
  const descripcion = watch("descripcion") ?? "";

  return (
    <form onSubmit={handleSubmit((d) => onOk({ ...d, tipo }))} className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-2">
      <p className="font-heading text-[15px] tracking-[0.06em] uppercase text-text-primary">Crear reclamo · Pedido {pedidoId}</p>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex items-center gap-2 text-[13px]"><input type="radio" checked={tipo === "RECLAMO"} onChange={() => setTipo("RECLAMO")} /> Reclamo</label>
        <label className="flex items-center gap-2 text-[13px]"><input type="radio" checked={tipo === "QUEJA"} onChange={() => setTipo("QUEJA")} /> Queja</label>
      </div>
      <select {...register("motivo")} aria-label="Motivo del reclamo" className="wf-input px-3 py-2.5 text-sm">
        {RECLAMO_MOTIVOS.map((m) => <option key={m}>{m}</option>)}
      </select>
      <textarea {...register("descripcion")} placeholder="Describe lo ocurrido (20 a 1000 caracteres)..." aria-label="Descripción del reclamo" rows={4} maxLength={1000} className="wf-input px-3 py-2.5 text-sm outline-none" />
      <p className="text-[11px] text-text-secondary text-right">{descripcion.length}/1000</p>
      {errors.descripcion && <span className="text-[12px] text-error-default">{errors.descripcion.message}</span>}
      <input {...register("documento")} placeholder="Documento (prellenado)" aria-label="Documento" className="wf-input px-3 py-2.5 text-sm outline-none" />
      <input {...register("solucion")} placeholder="¿Qué solución esperas?" aria-label="Solución esperada" className="wf-input px-3 py-2.5 text-sm outline-none" />
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onCancelar} className="wf-btn py-3 text-[12px] font-bold bg-white border border-border-default">CANCELAR</button>
        <button type="submit" disabled={descripcion.trim().length < 20} className="wf-btn py-3 text-[12px] font-bold bg-action-primary text-surface-ink disabled:opacity-45 inline-flex items-center justify-center gap-2">
          <FileAlertIcon size={16} />ENVIAR RECLAMO
        </button>
      </div>
    </form>
  );
}
