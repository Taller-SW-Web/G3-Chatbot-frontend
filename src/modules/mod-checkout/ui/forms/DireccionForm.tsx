"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useChatStore } from "@/shared/auth/chatStore";
import type { TipoDocumento } from "@/shared/auth/Cliente";
import { direccionSchema, type DireccionInput } from "@/modules/mod-checkout/domain/schemas/direccion.schema";
import { DISTRITOS_LIMA } from "@/modules/mod-checkout/domain/ubicaciones";

const tiposDocumento: TipoDocumento[] = ["DNI", "RUC", "CE", "PASAPORTE"];

function tipoValido(value: unknown): value is TipoDocumento {
  return typeof value === "string" && tiposDocumento.includes(value as TipoDocumento);
}

/** SPEC-12,14 documento A14 */
export type DireccionGuardadaInput = {
  nombre?: string;
  direccion?: string;
  distrito?: string;
  referencia?: string;
  docTipo?: TipoDocumento;
  docNum?: string;
};

export function DireccionForm({
  onValid,
  guardarDireccion = false,
  onGuardarChange,
  summary,
  direccionGuardada,
  avisoDireccion,
}: {
  onValid: (d: DireccionInput | null) => void;
  /** SPEC-12: el cliente decide si la dirección queda guardada en su perfil. */
  guardarDireccion?: boolean;
  onGuardarChange?: (guardar: boolean) => void;
  /** SPEC-12: snapshot del checkout con contacto y dirección previa. */
  summary?: Record<string, unknown> | null;
  /** SPEC-12: dirección predeterminada o guardada para prellenar. */
  direccionGuardada?: DireccionGuardadaInput | null;
  /** SPEC-12: aviso cuando Seguridad falla al guardar la dirección. */
  avisoDireccion?: string | null;
}) {
  const cliente = useChatStore((s) => s.cliente);
  const tipoPerfil = tipoValido(cliente?.ultimoDocumento?.tipo)
    ? cliente.ultimoDocumento.tipo
    : tipoValido(cliente?.tipoDocumento) ? cliente.tipoDocumento : undefined;

  // SPEC-12 :89-91: El documento del cliente se prellena desde checkout.summary.contacto
  // del pedido anterior, nunca del perfil de Seguridad.
  const summaryContacto = (summary?.contacto ?? {}) as Record<string, unknown>;
  const docTipoSummary = tipoValido(summaryContacto.tipoDocumento)
    ? (summaryContacto.tipoDocumento as TipoDocumento)
    : tipoValido(summaryContacto.docTipo)
      ? (summaryContacto.docTipo as TipoDocumento)
      : undefined;
  const docNumSummary =
    typeof summaryContacto.numeroDocumento === "string"
      ? summaryContacto.numeroDocumento
      : typeof summaryContacto.docNum === "string"
        ? summaryContacto.docNum
        : undefined;

  // Dirección guardada / predeterminada (SPEC-12 :104-107):
  const summaryDireccion = (summary?.direccion ?? {}) as Record<string, unknown>;
  const fuenteGuardada = direccionGuardada ?? (
    summaryDireccion.direccion && summaryDireccion.distrito
      ? {
          nombre: typeof summaryDireccion.destinatario === "string" ? summaryDireccion.destinatario : (typeof summaryDireccion.nombre === "string" ? summaryDireccion.nombre : undefined),
          direccion: typeof summaryDireccion.direccion === "string" ? summaryDireccion.direccion : undefined,
          distrito: typeof summaryDireccion.distrito === "string" ? summaryDireccion.distrito : undefined,
          referencia: typeof summaryDireccion.referencia === "string" ? summaryDireccion.referencia : undefined,
        }
      : null
  );

  const [cambiado, setCambiado] = useState(false);
  const usandoGuardada = !cambiado && Boolean(fuenteGuardada?.direccion && fuenteGuardada?.distrito);

  const { register, control, setValue, trigger, formState: { errors, touchedFields, dirtyFields } } = useForm<DireccionInput>({
    resolver: zodResolver(direccionSchema),
    mode: "onTouched",
    defaultValues: {
      nombre: fuenteGuardada?.nombre ?? cliente?.nombreCompleto ?? "",
      direccion: fuenteGuardada?.direccion ?? "",
      distrito: fuenteGuardada?.distrito ?? "",
      referencia: fuenteGuardada?.referencia ?? "",
      docTipo: docTipoSummary ?? (fuenteGuardada?.docTipo && tipoValido(fuenteGuardada.docTipo) ? fuenteGuardada.docTipo : (tipoValido(tipoPerfil) ? tipoPerfil : "DNI")),
      docNum: docNumSummary ?? fuenteGuardada?.docNum ?? "",
    },
  });
  const values = useWatch({ control });
  const docTipo = useWatch({ control, name: "docTipo" });

  useEffect(() => {
    if (direccionGuardada?.direccion && direccionGuardada?.distrito && !cambiado) {
      if (direccionGuardada.nombre) setValue("nombre", direccionGuardada.nombre, { shouldValidate: true });
      setValue("direccion", direccionGuardada.direccion, { shouldValidate: true });
      setValue("distrito", direccionGuardada.distrito, { shouldValidate: true });
      if (direccionGuardada.referencia) setValue("referencia", direccionGuardada.referencia);
      if (direccionGuardada.docTipo && tipoValido(direccionGuardada.docTipo)) setValue("docTipo", direccionGuardada.docTipo);
      if (direccionGuardada.docNum) setValue("docNum", direccionGuardada.docNum, { shouldValidate: true });
    }
  }, [direccionGuardada, cambiado, setValue]);

  useEffect(() => {
    if (!usandoGuardada && cliente?.nombreCompleto && !dirtyFields.nombre) setValue("nombre", cliente.nombreCompleto);
    if (!usandoGuardada && tipoValido(tipoPerfil) && !dirtyFields.docTipo) setValue("docTipo", tipoPerfil);
  }, [usandoGuardada, cliente?.nombreCompleto, tipoPerfil, dirtyFields.nombre, dirtyFields.docTipo, setValue]);

  useEffect(() => {
    const parsed = direccionSchema.safeParse(values);
    onValid(parsed.success ? parsed.data : null);
  }, [values, onValid]);

  useEffect(() => {
    if (touchedFields.docNum) void trigger("docNum");
  }, [docTipo, touchedFields.docNum, trigger]);

  const nombreError = touchedFields.nombre ? errors.nombre?.message : undefined;
  const direccionError = touchedFields.direccion ? errors.direccion?.message : undefined;
  const distritoError = touchedFields.distrito ? errors.distrito?.message : undefined;
  const docNumError = touchedFields.docNum ? errors.docNum?.message : undefined;

  return (
    <form id="direccion" onSubmit={(event) => event.preventDefault()}
      className="scroll-mt-20 rounded-md bg-white border border-border-default p-3 flex flex-col gap-3">
      <p className="font-heading text-[15px] uppercase">Dirección de envío</p>
      {usandoGuardada && (
        <div
          data-testid="aviso-direccion-guardada"
          className="rounded bg-surface-soft p-2.5 text-[12px] text-text-secondary flex items-center justify-between"
        >
          <span>Usando tu dirección guardada</span>
          <button
            type="button"
            onClick={() => {
              setCambiado(true);
              setValue("direccion", "", { shouldValidate: true, shouldDirty: true });
              setValue("distrito", "", { shouldValidate: true, shouldDirty: true });
              setValue("referencia", "", { shouldValidate: true, shouldDirty: true });
            }}
            className="underline font-semibold text-text-primary"
          >
            Cambiar
          </button>
        </div>
      )}
      {avisoDireccion && (
        <p
          role="status"
          data-testid="aviso-direccion-seguridad"
          className="rounded bg-warning-background text-warning-default p-2 text-[12px] font-medium"
        >
          {avisoDireccion}
        </p>
      )}
      <div className="flex flex-col gap-1">
        <label htmlFor="direccion-nombre" className="text-[13px] font-semibold">Nombre completo</label>
        <input id="direccion-nombre" {...register("nombre")} placeholder="Nombre y apellidos" autoComplete="name" enterKeyHint="next"
          aria-invalid={Boolean(nombreError)} aria-describedby={nombreError ? "direccion-nombre-error" : undefined}
          className="wf-input px-3 py-2.5 text-sm outline-none" />
        {nombreError && <span id="direccion-nombre-error" className="text-[12px] text-error-default">{nombreError}</span>}
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="direccion-calle" className="text-[13px] font-semibold">Dirección exacta</label>
        <input id="direccion-calle" {...register("direccion")} placeholder="Av. Arequipa 123, dpto. 401" autoComplete="street-address" enterKeyHint="next"
          aria-invalid={Boolean(direccionError)} aria-describedby={direccionError ? "direccion-calle-error" : undefined}
          className="wf-input px-3 py-2.5 text-sm outline-none" />
        {direccionError && <span id="direccion-calle-error" className="text-[12px] text-error-default">{direccionError}</span>}
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="direccion-distrito" className="text-[13px] font-semibold">Distrito de entrega</label>
        <select id="direccion-distrito" {...register("distrito")}
          aria-invalid={Boolean(distritoError)} aria-describedby={distritoError ? "direccion-distrito-error" : undefined}
          className="wf-input px-2 py-2.5 text-sm">
          <option value="">Elige un distrito</option>
          {DISTRITOS_LIMA.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        {distritoError && <span id="direccion-distrito-error" className="text-[12px] text-error-default">{distritoError}</span>}
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="direccion-referencia" className="text-[13px] font-semibold">Referencia <span className="font-normal text-text-secondary">(opcional)</span></label>
        <input id="direccion-referencia" {...register("referencia")} placeholder="Cerca del parque" enterKeyHint="next"
          className="wf-input px-3 py-2.5 text-sm outline-none" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <label htmlFor="direccion-doc-tipo" className="text-[13px] font-semibold">Tipo de documento</label>
          <select id="direccion-doc-tipo" {...register("docTipo")} className="wf-input px-2 py-2.5 text-sm">
            {tiposDocumento.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
          </select>
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <label htmlFor="direccion-doc-num" className="text-[13px] font-semibold">Número de documento</label>
          <input id="direccion-doc-num" {...register("docNum")} placeholder={docTipo === "DNI" ? "8 dígitos" : docTipo === "RUC" ? "11 dígitos" : "6 a 20 caracteres"}
            inputMode={docTipo === "DNI" || docTipo === "RUC" ? "numeric" : "text"}
            maxLength={docTipo === "DNI" ? 8 : docTipo === "RUC" ? 11 : 20} enterKeyHint="done"
            aria-invalid={Boolean(docNumError)} aria-describedby={docNumError ? "direccion-doc-num-error" : undefined}
            className="wf-input px-3 py-2.5 text-sm outline-none" />
          {docNumError && <span id="direccion-doc-num-error" className="text-[12px] text-error-default">{docNumError}</span>}
        </div>
      </div>
      {onGuardarChange && (
        <label htmlFor="direccion-guardar" className="flex items-start gap-2 text-[12px] text-text-secondary">
          <input
            id="direccion-guardar"
            type="checkbox"
            checked={guardarDireccion}
            onChange={(e) => onGuardarChange(e.target.checked)}
            className="mt-0.5"
          />
          <span>Guardar esta dirección para próximas compras</span>
        </label>
      )}
    </form>
  );
}
