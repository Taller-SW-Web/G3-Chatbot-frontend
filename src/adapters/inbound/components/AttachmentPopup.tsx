"use client";

import { useRef, useState } from "react";
import { XIcon, PhotoIcon, CameraIcon } from "./icons";

/**
 * Popup para agregar imagen desde el composer (galería o cámara),
 * con vista previa antes de enviar. Paridad con Mockups-Wireframes.
 */
export function AttachmentPopup({
  onClose,
  onSend,
}: {
  onClose: () => void;
  onSend: (nombreArchivo: string) => void;
}) {
  const [preview, setPreview] = useState<{ nombre: string; url: string } | null>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    setPreview({ nombre: file.name || "foto.jpg", url: URL.createObjectURL(file) });
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-surface-ink/60 fade-in p-5" onClick={onClose}>
      <div className="pop-in w-full max-w-[320px] bg-white rounded-lg shadow-xl max-h-[85%] overflow-y-auto no-scrollbar p-4 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="font-heading text-[15px] tracking-[0.06em] uppercase text-text-primary">Agregar imagen</p>
          <button aria-label="Cerrar" onClick={onClose}
            className="w-10 h-10 wf-btn flex items-center justify-center bg-surface-ink-soft text-text-inverse border border-border-inverse">
            <XIcon size={20} />
          </button>
        </div>
        <input ref={galleryRef} type="file" accept="image/*" className="hidden" aria-label="Elegir imagen de galería" onChange={(e) => handleFile(e.target.files?.[0])} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" aria-label="Tomar foto" onChange={(e) => handleFile(e.target.files?.[0])} />
        {!preview ? (
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => galleryRef.current?.click()} className="wf-btn py-3 text-[12px] font-bold bg-white border border-border-default text-text-primary inline-flex items-center justify-center gap-2"><PhotoIcon size={20} />GALERÍA</button>
            <button onClick={() => cameraRef.current?.click()} className="wf-btn py-3 text-[12px] font-bold bg-white border border-border-default text-text-primary inline-flex items-center justify-center gap-2"><CameraIcon size={20} />TOMAR FOTO</button>
          </div>
        ) : (
          <div className="rounded-md bg-white border border-border-default p-3 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview.url} alt={preview.nombre} className="w-16 h-16 rounded-md object-cover border border-border-default" />
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[13px] font-bold truncate">{preview.nombre}</p>
              <p className="text-[12px] text-text-secondary">JPG/PNG/WEBP ≤ 5MB</p>
            </div>
            <button onClick={() => setPreview(null)} className="text-[12px] font-semibold underline text-text-secondary shrink-0">Quitar</button>
          </div>
        )}
        <p className="text-[12px] text-text-secondary">La foto se envía al chat. Las imágenes del chat no se reutilizan como evidencia.</p>
        <button
          onClick={() => preview && onSend(preview.nombre)}
          disabled={!preview}
          className="wf-btn py-3 text-[12px] font-bold tracking-wide bg-action-primary text-surface-ink hover:bg-action-primary-hover disabled:opacity-45 disabled:cursor-not-allowed"
        >
          ENVIAR FOTO
        </button>
      </div>
    </div>
  );
}
