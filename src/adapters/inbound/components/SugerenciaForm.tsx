"use client";

import { useRef, useState } from "react";
import { PhotoIcon, CheckIcon } from "./icons";

/**
 * Formulario de sugerencia / reporte de bug con captura opcional
 * (biblioteca) y popup único de agradecimiento. Paridad mockup.
 */
export function SugerenciaForm({
  correo,
  onEnviado,
  onCancelar,
}: {
  correo: string;
  onEnviado: (codigo: string) => void;
  onCancelar: () => void;
}) {
  const [tipo, setTipo] = useState<"SUGERENCIA" | "BUG">("SUGERENCIA");
  const [titulo, setTitulo] = useState("");
  const [detalle, setDetalle] = useState("");
  const [evidencia, setEvidencia] = useState<{ nombre: string; url: string } | null>(null);
  const [gracias, setGracias] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const valido = titulo.trim().length >= 3 && detalle.trim().length >= 6;
  const codigo = tipo === "BUG" ? "BUG-2026-0031" : "SUG-2026-0142";

  function handleFile(file: File | undefined) {
    if (!file) return;
    setEvidencia({ nombre: file.name || "captura.jpg", url: URL.createObjectURL(file) });
  }

  return (
    <div className="relative flex flex-col gap-3">
      <div className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-2">
        <p className="font-heading text-[15px] tracking-[0.06em] uppercase text-text-primary">Enviar sugerencia / reportar bug</p>
        <p className="text-[12px] text-text-secondary">Cuéntanos tu experiencia con la tienda y Botleta. Lo revisa el equipo Inka.</p>
        <div className="grid grid-cols-2 gap-2 rounded-md bg-surface-cloud-subtle p-1">
          <button type="button" onClick={() => setTipo("SUGERENCIA")} aria-pressed={tipo === "SUGERENCIA"} className={`wf-btn py-2.5 text-[12px] font-bold ${tipo === "SUGERENCIA" ? "bg-surface-ink text-text-inverse" : "text-text-secondary"}`}>SUGERENCIA</button>
          <button type="button" onClick={() => setTipo("BUG")} aria-pressed={tipo === "BUG"} className={`wf-btn py-2.5 text-[12px] font-bold ${tipo === "BUG" ? "bg-surface-ink text-text-inverse" : "text-text-secondary"}`}>BUG</button>
        </div>
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)}
          placeholder={tipo === "BUG" ? "Ej. No carga el seguimiento en..." : "Ej. Agregar filtro por talla en..."}
          aria-label="Título" maxLength={80} className="wf-input px-3 py-2.5 text-sm outline-none" />
        <textarea value={detalle} onChange={(e) => setDetalle(e.target.value)}
          placeholder="Describe tu experiencia (mín. 6 caracteres): qué hacías, qué esperabas y qué pasó..."
          aria-label="Descripción de la experiencia" rows={5} maxLength={1000} className="wf-input px-3 py-2.5 text-sm outline-none" />
        <p className="text-[11px] text-text-secondary text-right">{detalle.length}/1000</p>
        {!valido && <p className="text-[11px] text-text-secondary">Completa el título (mín. 3) y la descripción (mín. 6) para activar Enviar.</p>}
        <input defaultValue={correo} placeholder="Correo de contacto" aria-label="Correo de contacto" className="wf-input px-3 py-2.5 text-sm outline-none" />
        <input ref={fileRef} type="file" accept="image/*" className="hidden" aria-label="Elegir captura de la biblioteca" onChange={(e) => handleFile(e.target.files?.[0])} />
        {!evidencia ? (
          <button type="button" onClick={() => fileRef.current?.click()}
            className="rounded-md border border-dashed border-border-default bg-surface-cloud-subtle min-h-20 px-3 py-4 flex items-center justify-center gap-2 text-[12px] text-text-secondary hover:border-accent-signal w-full">
            <PhotoIcon size={20} />Agregar captura (JPG/PNG ≤ 5 MB) — toca para abrir la biblioteca
          </button>
        ) : (
          <div className="rounded-md bg-white border border-border-default p-2.5 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={evidencia.url} alt={evidencia.nombre} className="w-14 h-14 rounded-md object-cover border border-border-default" />
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[13px] font-bold truncate">{evidencia.nombre}</p>
              <p className="text-[12px] text-text-secondary">JPG/PNG ≤ 5 MB</p>
            </div>
            <button type="button" onClick={() => fileRef.current?.click()} className="text-[12px] font-semibold underline text-text-secondary shrink-0">Cambiar</button>
            <button type="button" onClick={() => setEvidencia(null)} className="text-[12px] font-semibold underline text-text-secondary shrink-0">Quitar</button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onCancelar} className="wf-btn py-3 text-[12px] font-bold bg-white border border-border-default">CANCELAR</button>
        <button type="button" onClick={() => valido && setGracias(codigo)} disabled={!valido} title={valido ? "Enviar" : "Completa título y descripción"}
          className="wf-btn py-3 text-[12px] font-bold tracking-wide bg-action-primary text-surface-ink hover:bg-action-primary-hover disabled:opacity-45 disabled:cursor-not-allowed">ENVIAR</button>
      </div>
      <p className="text-[12px] text-text-secondary">Al enviar aceptas que te contactemos a tu correo para dar seguimiento.</p>

      {gracias && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-surface-ink/60 fade-in p-5" onClick={() => setGracias(null)}>
          <div className="pop-in w-full max-w-[320px] bg-white rounded-lg shadow-xl max-h-[85%] overflow-y-auto no-scrollbar p-6 flex flex-col items-center gap-3 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="wf-check w-16 h-16 rounded-full flex items-center justify-center bg-success-background text-success-default"><CheckIcon size={24} /></div>
            <h3 className="font-heading text-[20px]">{tipo === "BUG" ? "¡GRACIAS POR REPORTAR EL BUG!" : "¡GRACIAS POR TU SUGERENCIA!"}</h3>
            <p className="text-[13px] text-text-secondary">Código {gracias} · Lo revisaremos y te avisaremos por correo{evidencia ? " (con tu captura adjunta)" : ""}.</p>
            <button onClick={() => { setGracias(null); onEnviado(gracias); }} className="wf-btn w-full py-3 text-[12px] font-bold tracking-wide bg-action-primary text-surface-ink hover:bg-action-primary-hover">ENTENDIDO</button>
          </div>
        </div>
      )}
    </div>
  );
}
