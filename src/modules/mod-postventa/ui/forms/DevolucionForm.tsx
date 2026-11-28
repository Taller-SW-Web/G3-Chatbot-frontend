"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  devolucionSchema,
  DEVOLUCION_MOTIVOS,
  DEVOLUCION_MOTIVO_VALUES,
  type DevolucionInput,
  type DevolucionLinea,
  type DevolucionVariante,
} from "@/modules/mod-postventa/domain/schemas/devolucion.schema";
import { PhotoIcon, RefreshIcon, CheckIcon } from "@/shared/ui/icons";

export type DevolucionFormPayload = DevolucionInput & {
  evidenciaArchivo?: File;
  evidenciaNombre?: string;
  items?: { productoId: string; cantidad: number }[];
  evidenciasArchivos?: File[];
  varianteDeseada?: string;
};

/**
 * SPEC-21: líneas múltiples, tipo cambio/devolución, 6 motivos, descripción,
 * evidencias (hasta 3 archivos JPG/PNG/WEBP/PDF ≤ 5MB) con vista previa y selección de variante.
 */
export function DevolucionForm({
  lineas,
  tipoInicial,
  motivoInicial,
  descripcionInicial,
  lineaInicial,
  onOk,
  onCancelar,
}: {
  lineas: (DevolucionLinea | string)[];
  /** Valores que el chat puede precargar al abrir el formulario. */
  tipoInicial?: "CAMBIO" | "DEVOLUCION_DINERO";
  motivoInicial?: (typeof DEVOLUCION_MOTIVO_VALUES)[number];
  descripcionInicial?: string;
  lineaInicial?: string;
  onOk: (d: DevolucionFormPayload) => void | Promise<void>;
  onCancelar: () => void;
}) {
  const normalizedLineas: DevolucionLinea[] = lineas.map((l) =>
    typeof l === "string" ? { productoId: l, label: l } : l
  );

  const [tipo, setTipo] = useState<"CAMBIO" | "DEVOLUCION_DINERO">(tipoInicial ?? "CAMBIO");
  const [evidencias, setEvidencias] = useState<
    Array<{
      file: File;
      nombre: string;
      url: string;
      tamano: number;
    }>
  >([]);
  const [evidenciaError, setEvidenciaError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const defaultLinea = lineaInicial ?? normalizedLineas[0]?.productoId ?? "";
  const [selectedLineas, setSelectedLineas] = useState<Record<string, number>>(() => {
    return defaultLinea ? { [defaultLinea]: 1 } : {};
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DevolucionInput>({
    resolver: zodResolver(devolucionSchema),
    defaultValues: {
      tipo: tipoInicial ?? "CAMBIO",
      linea: defaultLinea,
      motivo: motivoInicial ?? "TALLA_INCORRECTA",
      descripcion: descripcionInicial ?? undefined,
    },
  });

  const descripcion = watch("descripcion") ?? "";
  const motivo = watch("motivo");
  const lineaActualId = watch("linea");

  // Multi-line selection calculation:
  const lineasSeleccionadasEntries = Object.entries(selectedLineas).filter(([, cant]) => cant > 0);
  const itemsParaEnviar: { productoId: string; cantidad: number }[] =
    lineasSeleccionadasEntries.length > 0
      ? lineasSeleccionadasEntries.map(([productoId, cantidad]) => ({ productoId, cantidad }))
      : normalizedLineas.length > 1
        ? []
        : lineaActualId
          ? [{ productoId: lineaActualId, cantidad: 1 }]
          : [];

  const primeraLinea =
    normalizedLineas.find((l) => l.productoId === (itemsParaEnviar[0]?.productoId ?? lineaActualId)) ??
    normalizedLineas[0];

  const variantesDisponibles: DevolucionVariante[] = primeraLinea?.variantes ?? [];

  const [varianteSeleccionadaSku, setVarianteSeleccionadaSku] = useState<string>(
    () => variantesDisponibles[0]?.sku ?? ""
  );
  const [varianteLibre, setVarianteLibre] = useState<string>("");

  const varianteActual =
    variantesDisponibles.find((v) => v.sku === varianteSeleccionadaSku) ?? variantesDisponibles[0];
  const sinStock = tipo === "CAMBIO" && Boolean(varianteActual && !varianteActual.disponible);

  // G5 maps `PRODUCTO_EQUIVOCADO_ENVIADO` to `PRODUCTO_INCORRECTO`, which also
  // requires evidence. Keep the rule in the UI so the customer does not fail
  // only after uploading the form.
  const requiereEvidencia =
    motivo === "PRODUCTO_DEFECTUOSO" || motivo === "PRODUCTO_EQUIVOCADO_ENVIADO";

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setEvidenciaError(null);
    const nuevos: Array<{ file: File; nombre: string; url: string; tamano: number }> = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        setEvidenciaError("Cada evidencia debe ser ≤ 5MB");
        return;
      }
      let url = "";
      try {
        if (typeof URL.createObjectURL === "function") {
          url = URL.createObjectURL(file);
        }
      } catch {
        url = "";
      }
      nuevos.push({
        file,
        nombre: file.name,
        url,
        tamano: file.size,
      });
    }

    setEvidencias((prev) => {
      const combinado = [...prev, ...nuevos];
      if (combinado.length > 3) {
        setEvidenciaError("Máximo 3 evidencias permitidas");
        return combinado.slice(0, 3);
      }
      return combinado;
    });
  }

  function handleQuitarEvidencia(index: number) {
    setEvidencias((prev) => prev.filter((_, i) => i !== index));
    setEvidenciaError(null);
  }

  return (
    <form
      onSubmit={handleSubmit((d) => {
        const lineaFinal = itemsParaEnviar[0]?.productoId ?? d.linea;
        return onOk({
          ...d,
          linea: lineaFinal,
          tipo,
          items: itemsParaEnviar,
          evidenciaTamano: evidencias[0]?.tamano,
          evidenciaNombre: evidencias[0]?.nombre,
          evidenciaArchivo: evidencias[0]?.file,
          evidenciasArchivos: evidencias.map((e) => e.file),
          varianteDeseada:
            tipo === "CAMBIO"
              ? (variantesDisponibles.length > 0
                  ? (varianteActual?.sku ?? varianteActual?.label)
                  : (varianteLibre.trim() || undefined))
              : undefined,
        });
      })}
      className="flex flex-col gap-3"
    >
      <select
        {...register("linea")}
        value={lineaActualId}
        onChange={(e) => {
          setValue("linea", e.target.value);
          setSelectedLineas({ [e.target.value]: 1 });
        }}
        aria-label="Línea a devolver"
        className="wf-input px-3 py-2.5 text-sm"
      >
        {normalizedLineas.map((l) => (
          <option key={l.productoId} value={l.productoId}>
            {l.label}
          </option>
        ))}
      </select>

      {normalizedLineas.length > 1 && (
        <div className="flex flex-col gap-2 rounded-md border border-border-default bg-surface-cloud-subtle p-2.5">
          <span className="text-[12px] font-bold text-text-secondary">Seleccionar líneas del pedido</span>
          {normalizedLineas.map((l) => {
            const isSelected = Boolean(selectedLineas[l.productoId]);
            const qty = selectedLineas[l.productoId] ?? 1;
            return (
              <div
                key={l.productoId}
                className="flex items-center justify-between gap-2 p-1.5 bg-white rounded border border-border-default"
              >
                <label className="flex items-center gap-2 text-[13px] cursor-pointer flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setSelectedLineas((prev) => {
                        const next = { ...prev };
                        if (checked) {
                          next[l.productoId] = 1;
                          setValue("linea", l.productoId);
                        } else {
                          delete next[l.productoId];
                        }
                        return next;
                      });
                    }}
                    aria-label={`Seleccionar ${l.label}`}
                  />
                  <span className="truncate">{l.label}</span>
                </label>
                {isSelected && (
                  <div className="flex items-center gap-1 shrink-0">
                    <label htmlFor={`cant-${l.productoId}`} className="text-[11px] text-text-secondary">
                      Cant:
                    </label>
                    <input
                      id={`cant-${l.productoId}`}
                      type="number"
                      min={1}
                      max={l.cantidadMaxima ?? 99}
                      value={qty}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(l.cantidadMaxima ?? 99, Number(e.target.value) || 1));
                        setSelectedLineas((prev) => ({ ...prev, [l.productoId]: val }));
                      }}
                      className="w-14 px-1.5 py-0.5 text-[12px] border rounded"
                      aria-label={`Cantidad para ${l.label}`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 rounded-md bg-white border border-border-default p-1">
        <button
          type="button"
          onClick={() => setTipo("CAMBIO")}
          aria-pressed={tipo === "CAMBIO"}
          className={`wf-btn py-2.5 text-[12px] font-bold ${
            tipo === "CAMBIO" ? "bg-surface-ink text-text-inverse" : "text-text-secondary"
          }`}
        >
          CAMBIO
        </button>
        <button
          type="button"
          onClick={() => setTipo("DEVOLUCION_DINERO")}
          aria-pressed={tipo === "DEVOLUCION_DINERO"}
          className={`wf-btn py-2.5 text-[12px] font-bold ${
            tipo === "DEVOLUCION_DINERO" ? "bg-surface-ink text-text-inverse" : "text-text-secondary"
          }`}
        >
          DEVOLUCIÓN
        </button>
      </div>

      {tipo === "CAMBIO" && (
        <div className="flex flex-col gap-1">
          {variantesDisponibles.length > 0 ? (
            <>
              <select
                aria-label="Talla o color deseado"
                value={varianteActual?.sku ?? ""}
                onChange={(e) => setVarianteSeleccionadaSku(e.target.value)}
                className="wf-input px-3 py-2.5 text-sm"
              >
                {variantesDisponibles.map((v) => (
                  <option key={v.sku} value={v.sku}>
                    {v.label}{!v.disponible ? " (Sin stock)" : ""}
                  </option>
                ))}
              </select>
              {sinStock && (
                <span role="alert" className="text-[12px] text-error-default font-medium">
                  Variante seleccionada sin stock
                </span>
              )}
            </>
          ) : (
            <input
              type="text"
              value={varianteLibre}
              onChange={(e) => setVarianteLibre(e.target.value)}
              placeholder="Indica la talla o color deseado..."
              aria-label="Talla o color deseado"
              className="wf-input px-3 py-2.5 text-sm"
            />
          )}
        </div>
      )}

      <select
        {...register("motivo")}
        defaultValue={motivoInicial ?? "TALLA_INCORRECTA"}
        aria-label="Motivo"
        className="wf-input px-3 py-2.5 text-sm"
      >
        {DEVOLUCION_MOTIVOS.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>

      <input
        ref={fileRef}
        type="file"
        accept="image/*,.pdf"
        multiple
        className="hidden"
        aria-label="Subir evidencia"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {evidencias.length === 0 ? (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-md border border-dashed border-border-default bg-surface-cloud-subtle min-h-24 px-3 py-5 flex items-center justify-center gap-2 text-[12px] text-text-secondary"
        >
          <PhotoIcon size={20} />
          Evidencia (JPG/PNG/WEBP/PDF ≤ 5MB) — toca para adjuntar
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          {evidencias.map((ev, idx) => (
            <div
              key={`${ev.nombre}-${idx}`}
              className="rounded-md bg-white border border-border-default p-2.5 flex items-center gap-3"
            >
              <span className="w-12 h-12 rounded-md bg-surface-cloud-subtle border border-border-default flex items-center justify-center text-text-secondary">
                <PhotoIcon size={20} />
              </span>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[13px] font-bold truncate">{ev.nombre}</p>
                <p className="text-[12px] text-text-secondary">
                  {(ev.tamano / 1024).toFixed(0)} KB · JPG/PNG/WEBP/PDF ≤ 5MB
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleQuitarEvidencia(idx)}
                className="text-[12px] font-semibold underline text-text-secondary shrink-0"
              >
                Quitar
              </button>
            </div>
          ))}
          {evidencias.length < 3 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-[12px] font-semibold text-action-primary hover:underline text-left"
            >
              + Adjuntar otra evidencia ({evidencias.length}/3)
            </button>
          )}
        </div>
      )}

      {evidenciaError && <span className="text-[12px] text-error-default">{evidenciaError}</span>}
      {errors.evidenciaTamano && (
        <span className="text-[12px] text-error-default">{errors.evidenciaTamano.message}</span>
      )}
      {requiereEvidencia && evidencias.length === 0 ? (
        <span className="text-[12px] text-error-default">Este motivo exige al menos una evidencia.</span>
      ) : null}

      <textarea
        {...register("descripcion")}
        placeholder="Descripción..."
        aria-label="Descripción"
        rows={3}
        maxLength={1000}
        className="wf-input px-3 py-2.5 text-sm outline-none"
      />
      <p className="text-[11px] text-text-secondary text-right">{descripcion.length}/1000</p>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onCancelar}
          className="wf-btn py-3 text-[12px] font-bold bg-white border border-border-default"
        >
          CANCELAR
        </button>
        <button
          type="submit"
          disabled={
            isSubmitting ||
            (requiereEvidencia && evidencias.length === 0) ||
            sinStock ||
            (normalizedLineas.length > 0 && itemsParaEnviar.length === 0)
          }
          className="wf-btn py-3 text-[12px] font-bold tracking-wide bg-action-primary text-surface-ink hover:bg-action-primary-hover disabled:opacity-45 inline-flex items-center justify-center gap-2"
        >
          {evidencias.length > 0 ? <CheckIcon size={16} /> : <RefreshIcon size={16} />}
          {isSubmitting ? "ENVIANDO..." : "ENVIAR SOLICITUD"}
        </button>
      </div>
    </form>
  );
}
