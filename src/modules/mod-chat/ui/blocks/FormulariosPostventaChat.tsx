"use client";

import { useState } from "react";
import type { ComponentProps } from "react";
import { DevolucionForm, ReclamoForm } from "@/modules/mod-postventa/public";
import { useChatStore } from "@/shared/auth/chatStore";
import { usePerfil } from "@/shared/auth/usePerfil";
import { container } from "@/shared/di/container";
import type { AccionRapidaChat } from "@/modules/mod-chat/ui/ChatWindow";

type OnAccion = (accion: AccionRapidaChat) => void | Promise<void>;

type DatosReclamo = {
  pedidoId?: unknown;
  tipo?: unknown;
  motivo?: unknown;
  descripcion?: unknown;
  pedidoCliente?: unknown;
};

type DatosDevolucion = {
  pedidoId?: unknown;
  tipo?: unknown;
  motivo?: unknown;
  descripcion?: unknown;
  lineaRef?: unknown;
  items?: unknown;
};

type ItemPedido = {
  productoId?: unknown;
  descripcion?: unknown;
};

function texto(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function registro(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function motivoDe<T extends string>(value: unknown): T | undefined {
  return typeof value === "string" ? (value as T) : undefined;
}

function lineasDe(items: unknown) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item, index) => {
      const row = registro(item) as ItemPedido;
      const productoId = texto(row.productoId);
      return {
        productoId,
        label: texto(row.descripcion, `Producto ${index + 1}`),
      };
    })
    .filter((linea) => linea.productoId.length > 0);
}

/** FORMULARIO/RECLAMO: prellena y envía `CONFIRMAR_RECLAMO` con la acción directa del chat. */
export function FormularioReclamoChat({
  datos,
  onAccion,
  busy = false,
}: {
  datos?: Record<string, unknown>;
  onAccion?: OnAccion;
  busy?: boolean;
}) {
  const perfil = usePerfil();
  const [estado, setEstado] = useState<"form" | "enviado" | "cancelado">("form");
  const d = registro(datos) as DatosReclamo;
  const pedidoId = texto(d.pedidoId);

  if (!pedidoId) return null;
  if (estado === "cancelado") {
    return (
      <p className="text-[13px] text-text-secondary" role="status">
        Puedes pedirme de nuevo que prepare el reclamo cuando quieras.
      </p>
    );
  }
  if (estado === "enviado") {
    return (
      <p className="text-[13px] text-text-secondary" role="status">
        Enviando tu reclamo…
      </p>
    );
  }
  if (perfil.isLoading) {
    return (
      <p className="text-[13px] text-text-secondary" role="status">
        Cargando tus datos…
      </p>
    );
  }
  if (perfil.isError || !perfil.data) {
    return (
      <p className="text-[13px] text-error-default" role="alert">
        No pudimos cargar tu perfil. Intenta de nuevo.
      </p>
    );
  }

  return (
    <fieldset disabled={busy} className="m-0 min-w-0 border-0 p-0">
      <ReclamoForm
        pedidoId={pedidoId}
        telefonoInicial={perfil.data.celular ?? ""}
        tipoInicial={d.tipo === "QUEJA" ? "QUEJA" : "RECLAMO"}
        motivoInicial={motivoDe<NonNullable<ComponentProps<typeof ReclamoForm>["motivoInicial"]>>(d.motivo)}
        descripcionInicial={texto(d.descripcion) || undefined}
        onCancelar={() => setEstado("cancelado")}
        onOk={async (input) => {
          if (!onAccion) return;
          setEstado("enviado");
          await onAccion({
            id: "CONFIRMAR_RECLAMO",
            etiqueta: "Enviar reclamo",
            payload: {
              pedidoId: input.pedidoId,
              tipo: input.tipo,
              motivo: input.motivo,
              descripcion: input.descripcion,
              solucionEsperada: input.solucion,
              consumidor: {
                nombreCompleto: perfil.data.nombreCompleto,
                documento: input.documento,
                email: perfil.data.correo,
                telefono: input.telefono,
              },
            },
          });
        }}
      />
    </fieldset>
  );
}

/** FORMULARIO/DEVOLUCION: prellena y envía `CONFIRMAR_DEVOLUCION` con la acción directa del chat. */
export function FormularioDevolucionChat({
  datos,
  onAccion,
  busy = false,
}: {
  datos?: Record<string, unknown>;
  onAccion?: OnAccion;
  busy?: boolean;
}) {
  const ultimaConversacionId = useChatStore((state) => state.ultimaConversacionId);
  const [estado, setEstado] = useState<"form" | "enviado" | "cancelado">("form");
  const [error, setError] = useState<string | null>(null);
  const d = registro(datos) as DatosDevolucion;
  const pedidoId = texto(d.pedidoId);
  const lineas = lineasDe(d.items);

  if (!pedidoId || lineas.length === 0) return null;
  if (estado === "cancelado") {
    return (
      <p className="text-[13px] text-text-secondary" role="status">
        Puedes pedirme de nuevo que prepare la solicitud cuando quieras.
      </p>
    );
  }
  if (estado === "enviado") {
    return (
      <p className="text-[13px] text-text-secondary" role="status">
        Enviando tu solicitud…
      </p>
    );
  }

  return (
    <fieldset disabled={busy} className="m-0 min-w-0 border-0 p-0">
      <DevolucionForm
        lineas={lineas}
        tipoInicial={d.tipo === "DEVOLUCION_DINERO" ? "DEVOLUCION_DINERO" : "CAMBIO"}
        motivoInicial={motivoDe<NonNullable<ComponentProps<typeof DevolucionForm>["motivoInicial"]>>(d.motivo)}
        descripcionInicial={texto(d.descripcion) || undefined}
        lineaInicial={texto(d.lineaRef) || undefined}
        onCancelar={() => setEstado("cancelado")}
        onOk={async (input) => {
          if (!onAccion) return;
          setEstado("enviado");
          setError(null);
          try {
            const evidencia = input.evidenciaArchivo
              ? await container.postventa.subirEvidencia(
                  input.evidenciaArchivo,
                  ultimaConversacionId ?? undefined,
                )
              : null;
            await onAccion({
              id: "CONFIRMAR_DEVOLUCION",
              etiqueta: "Enviar solicitud",
              payload: {
                pedidoId,
                tipo: input.tipo,
                motivo: input.motivo,
                descripcion: input.descripcion,
                items: [{ productoId: input.linea, cantidad: 1 }],
                evidencias: evidencia ? [{ tipo: evidencia.tipo, url: evidencia.url }] : [],
              },
            });
          } catch {
            setEstado("form");
            setError("No pudimos enviar tu solicitud. Intenta de nuevo.");
          }
        }}
      />
      {error && (
        <p className="mt-2 text-[13px] text-error-default" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
