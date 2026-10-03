"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { devolucionSchema, DEVOLUCION_MOTIVOS, type DevolucionInput } from "@/domain/schemas/devolucion.schema";
import { PhotoIcon, RefreshIcon, CheckIcon } from "../icons";

/**
 * SPEC-21: línea, tipo cambio/devolución, 6 motivos, descripción,
 * evidencia 1 archivo (JPG/PNG/WEBP/PDF ≤ 5MB) con vista previa.
 */
export function DevolucionForm({
  lineas,
  onOk,
  onCancelar,
}: {
  lineas: string[];
  onOk: (d: DevolucionInput & { evidenciaNombre?: string }) => void;
  onCancelar: () => void;
}) {
  const [tipo, setTipo] = useState<"CAMBIO" | "DEVOLUCION">("CAMBIO");
  const [evidencia, setEvidencia] = useState<{ nombre: string; url: string; tamano: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<DevolucionInput>({
    resolver: zodResolver(devolucionSchema),
    defaultValues: { tipo: "CAMBIO", linea: lineas[0] ?? "", motivo: "Talla incorrecta" },
  });
  const descripcion = watch("descripcion") ?? "";

  function handleFile(file: File | undefined) {
    if (!file) return;
    setEvidencia({ nombre: file.name, url: URL.createObjectURL(file), tamano: file.size });
  }

  return (
    <form
      onSubmit={handleSubmit((d) =>
        onOk({ ...d, tipo, evidenciaTamano: evidencia?.tamano, evidenciaNombre: evidencia?.nombre })
      )}
      className="flex flex-col gap-3"
    >
      <select {...register("linea")} aria-label="Línea a devolver" className="wf-input px-3 py-2.5 text-sm">
        {lineas.map((l) => <option key={l}>{l}</option>)}
      </select>
      <div className="grid grid-cols-2 gap-2 rounded-md bg-white border border-border-default p-1">
        <button type="button" onClick={() => setTipo("CAMBIO")} aria-pressed={tipo === "CAMBIO"} className={`wf-btn py-2.5 text-[12px] font-bold ${tipo === "CAMBIO" ? "bg-surface-ink text-text-inverse" : "text-text-secondary"}`}>CAMBIO</button>
        <button type="button" onClick={() => setTipo("DEVOLUCION")} aria-pressed={tipo === "DEVOLUCION"} className={`wf-btn py-2.5 text-[12px] font-bold ${tipo === "DEVOLUCION" ? "bg-surface-ink text-text-inverse" : "text-text-secondary"}`}>DEVOLUCIÓN</button>
      </div>
      {tipo === "CAMBIO" && (
        <select aria-label="Talla o color deseado" className="wf-input px-3 py-2.5 text-sm">
          <option>Talla 42 · Negro (Disponible)</option>
          <option>Talla 43 · Negro (Pocas unidades)</option>
        </select>
      )}
      <select {...register("motivo")} aria-label="Motivo" className="wf-input px-3 py-2.5 text-sm">
        {DEVOLUCION_MOTIVOS.map((m) => <option key={m}>{m}</option>)}
      </select>
      <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" aria-label="Subir evidencia" onChange={(e) => handleFile(e.target.files?.[0])} />
      {!evidencia ? (
        <button type="button" onClick={() => fileRef.current?.click()}
          className="rounded-md border border-dashed border-border-default bg-surface-cloud-subtle min-h-24 px-3 py-5 flex items-center justify-center gap-2 text-[12px] text-text-secondary">
          <PhotoIcon size={20} />Evidencia (JPG/PNG/WEBP/PDF ≤ 5MB) — toca para adjuntar
        </button>
      ) : (
        <div className="rounded-md bg-white border border-border-default p-2.5 flex items-center gap-3">
          <span className="w-12 h-12 rounded-md bg-surface-cloud-subtle border border-border-default flex items-center justify-center text-text-secondary"><PhotoIcon size={20} /></span>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[13px] font-bold truncate">{evidencia.nombre}</p>
            <p className="text-[12px] text-text-secondary">{(evidencia.tamano / 1024).toFixed(0)} KB · JPG/PNG/WEBP/PDF ≤ 5MB</p>
          </div>
          <button type="button" onClick={() => setEvidencia(null)} className="text-[12px] font-semibold underline text-text-secondary shrink-0">Quitar</button>
        </div>
      )}
      {errors.evidenciaTamano && <span className="text-[12px] text-error-default">{errors.evidenciaTamano.message}</span>}
      <textarea {...register("descripcion")} placeholder="Descripción..." aria-label="Descripción" rows={3} maxLength={1000} className="wf-input px-3 py-2.5 text-sm outline-none" />
      <p className="text-[11px] text-text-secondary text-right">{descripcion.length}/1000</p>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onCancelar} className="wf-btn py-3 text-[12px] font-bold bg-white border border-border-default">CANCELAR</button>
        <button type="submit" className="wf-btn py-3 text-[12px] font-bold tracking-wide bg-action-primary text-surface-ink hover:bg-action-primary-hover inline-flex items-center justify-center gap-2">
          {evidencia ? <CheckIcon size={16} /> : <RefreshIcon size={16} />}ENVIAR SOLICITUD
        </button>
      </div>
    </form>
  );
}
