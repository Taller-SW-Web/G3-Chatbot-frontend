"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useChatStore } from "@/application/state/chatStore";
import type { TipoDocumento } from "@/domain/entities/Cliente";
import { direccionSchema, type DireccionInput } from "@/domain/schemas/direccion.schema";
import { DISTRITOS_LIMA } from "@/domain/entities/ubicaciones";

const tiposDocumento: TipoDocumento[] = ["DNI", "RUC", "CE", "PASAPORTE"];

function tipoValido(value: unknown): value is TipoDocumento {
  return typeof value === "string" && tiposDocumento.includes(value as TipoDocumento);
}

/** SPEC-12,14 documento A14 */
export function DireccionForm({ onValid }: { onValid: (d: DireccionInput | null) => void }) {
  const cliente = useChatStore((s) => s.cliente);
  const tipoPerfil = tipoValido(cliente?.ultimoDocumento?.tipo)
    ? cliente.ultimoDocumento.tipo
    : tipoValido(cliente?.tipoDocumento) ? cliente.tipoDocumento : undefined;
  const { register, control, setValue, trigger, formState: { errors, touchedFields, dirtyFields } } = useForm<DireccionInput>({
    resolver: zodResolver(direccionSchema),
    mode: "onTouched",
    defaultValues: {
      nombre: cliente?.nombreCompleto ?? "",
      direccion: "",
      distrito: "",
      referencia: "",
      docTipo: tipoValido(tipoPerfil) ? tipoPerfil : "DNI",
      docNum: "",
    },
  });
  const values = useWatch({ control });
  const docTipo = useWatch({ control, name: "docTipo" });

  useEffect(() => {
    if (cliente?.nombreCompleto && !dirtyFields.nombre) setValue("nombre", cliente.nombreCompleto);
    if (tipoValido(tipoPerfil) && !dirtyFields.docTipo) setValue("docTipo", tipoPerfil);
  }, [cliente?.nombreCompleto, tipoPerfil, dirtyFields.nombre, dirtyFields.docTipo, setValue]);

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
    <form onSubmit={(event) => event.preventDefault()}
      className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-3">
      <p className="font-heading text-[15px] uppercase">Dirección de envío</p>
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
    </form>
  );
}
