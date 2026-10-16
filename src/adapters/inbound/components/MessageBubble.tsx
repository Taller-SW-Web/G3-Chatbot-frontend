"use client";
import type { ReactNode } from "react";
import type {
  Bloque,
  BloqueAcciones,
  BloqueCarrusel,
  BloqueConfirmacion,
  BloqueDetalle,
  BloqueError,
  BloqueResumenCheckout,
  BloqueTexto,
} from "@/domain/entities/Bloque";
import { sanitize } from "@/domain/utils/sanitize";
import { AccionesRapidas } from "./blocks/AccionesRapidas";
import { CarruselProductos } from "./blocks/CarruselProductos";
import { ConfirmacionPedido } from "./blocks/ConfirmacionPedido";
import { DetalleProducto } from "./blocks/DetalleProducto";
import { ResumenCheckout } from "./blocks/ResumenCheckout";
import { mensajePorCodigo } from "./chatPresentacion";
import { dividirResaltado } from "./resaltadoChat";
import { TextoMarkdown } from "./TextoMarkdown";

type Props = {
  texto: string;
  rol: "user" | "bot";
  /** Bloques del turno (SPEC-05 Req. 4); los tipos sin componente no se pintan. */
  bloques?: Bloque[];
  /** Respuesta en construcción: tokens llegando por SSE (efecto de escritura en vivo). */
  streaming?: boolean;
  /** Las acciones rápidas envían su etiqueta como mensaje de texto normal. */
  onEnviarAccion?: (etiqueta: string) => void;
  /** First bot reply: Botleta introduction. */
  isFirstAssistant?: boolean;
};

/** Texto del chat con códigos y promociones en negrita. Sin innerHTML (R7). */
export function renderChatText(texto: string, dark = false): ReactNode {
  const segmentos = dividirResaltado(sanitize(texto));
  return segmentos.map((s, i) =>
    s.resaltado ? (
      <strong key={i} className={`font-bold ${dark ? "text-text-inverse" : "text-text-primary"}`}>{s.texto}</strong>
    ) : (
      <span key={i}>{s.texto}</span>
    )
  );
}

function esBloqueTexto(b: Bloque): b is BloqueTexto {
  return b.tipo === "TEXTO" && typeof (b as BloqueTexto).texto === "string";
}

function esBloqueError(b: Bloque): b is BloqueError {
  return b.tipo === "ERROR" && typeof (b as BloqueError).code === "string";
}

const noop = () => {};

/**
 * Renderiza un bloque por tipo con los componentes existentes. Los que dependen de
 * funcionalidades pendientes (carrito, detalle, reenvío de correo) se pintan inertes;
 * los tipos sin forma definida en `Bloque` no se pintan.
 */
export function renderBloque(
  bloque: Bloque,
  clave: number,
  onEnviarAccion?: (etiqueta: string) => void
): ReactNode {
  if (esBloqueTexto(bloque)) {
    return <p key={clave} data-testid="bloque-texto">{renderChatText(bloque.texto)}</p>;
  }
  if (esBloqueError(bloque)) {
    return (
      <p key={clave} data-testid="bloque-error" data-code={bloque.code}>
        {mensajePorCodigo(bloque.code)}
      </p>
    );
  }
  switch (bloque.tipo) {
    case "ACCIONES_RAPIDAS": {
      const b = bloque as BloqueAcciones;
      if (!Array.isArray(b.acciones) || b.acciones.length === 0) return null;
      return (
        <div key={clave} data-testid="bloque-acciones-rapidas" className="mt-2">
          <AccionesRapidas
            pregunta={b.pregunta}
            acciones={b.acciones.map((a) => a.etiqueta)}
            onAccion={onEnviarAccion ?? noop}
          />
        </div>
      );
    }
    case "DETALLE_PRODUCTO": {
      const b = bloque as BloqueDetalle;
      if (!b.producto) return null;
      return (
        <div key={clave} data-testid="bloque-detalle-producto" className="mt-2">
          <DetalleProducto p={b.producto} />
        </div>
      );
    }
    case "RESUMEN_CHECKOUT": {
      const b = bloque as BloqueResumenCheckout;
      return (
        <div key={clave} data-testid="bloque-resumen-checkout" className="mt-2">
          <ResumenCheckout
            total={b.total}
            direccion={b.direccion}
            tarjetaLast4={String(b.tarjetaEnmascarada ?? "").slice(-4)}
          />
        </div>
      );
    }
    case "CARRUSEL_PRODUCTOS": {
      const b = bloque as BloqueCarrusel;
      if (!Array.isArray(b.productos)) return null;
      return (
        // Inerte: agregar al carrito y ver detalle dependen de funcionalidades pendientes.
        <div key={clave} data-testid="bloque-carrusel-productos" className="mt-2" inert>
          <CarruselProductos titulo={b.titulo} productos={b.productos} onAdd={noop} onDetalle={noop} />
        </div>
      );
    }
    case "CONFIRMACION_PEDIDO": {
      const b = bloque as BloqueConfirmacion;
      return (
        // Inerte: reenviar la confirmación no está disponible desde el chat todavía.
        <div key={clave} data-testid="bloque-confirmacion-pedido" className="mt-2" inert>
          <ConfirmacionPedido pedidoId={b.pedidoId} correoEnmascarado={b.correoEnmascarado} />
        </div>
      );
    }
    default:
      return null;
  }
}

/** Burbuja de mensaje. Todo texto pasa por sanitize (R7). */
export function MessageBubble({ texto, rol, bloques = [], streaming = false, isFirstAssistant = false, onEnviarAccion }: Props) {
  if (rol === "user") {
    return (
      <div
        data-testid="message-bubble"
        data-rol="user"
        className="msg-in self-end max-w-[80%] rounded-md rounded-br-xs px-3 py-2 text-[14px] leading-5 bg-surface-ink text-text-inverse"
      >
        {renderChatText(texto, true)}
      </div>
    );
  }
  return (
    <div
      data-testid="message-bubble"
      data-rol="bot"
      aria-live={streaming ? "polite" : undefined}
      className="msg-in self-start max-w-[85%] rounded-md rounded-bl-xs px-3 py-2 text-[14px] leading-5 bg-white text-text-primary border border-border-default"
    >
      {isFirstAssistant && (
        <p data-testid="presentacion-botleta">
          Soy Botleta, asistente virtual. Conversas con un asistente virtual con IA.
          No compartas contraseñas ni datos de tarjeta.
        </p>
      )}
      {texto && <TextoMarkdown texto={sanitize(texto)} />}
      {bloques.map((bloque, i) => renderBloque(bloque, i, onEnviarAccion))}
      {streaming && <span data-testid="typing-indicator" aria-label="escribiendo" />}
    </div>
  );
}