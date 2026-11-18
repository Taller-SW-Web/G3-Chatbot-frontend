"use client";
import type { ReactNode } from "react";
import type {
  Bloque,
  BloqueCarritoResumen,
  BloqueCarrusel,
  BloqueConfirmacion,
  BloqueDetalle,
  BloqueError,
  BloqueFormulario,
  BloqueResumenCheckout,
  BloqueSelectorVariante,
  BloqueTexto,
  PromotionsBlock,
} from "@/domain/entities/Bloque";
import {
  accionAgregarDeTarjeta,
  accionVerDetalle,
  datosDeCarrito,
  detalleDeBloque,
  esFormularioRegistro,
  faltantesDeSelector,
  productosDeCarrusel,
  carouselMetadata,
  parseQuickActions,
} from "@/domain/utils/bloquesChat";
import { sanitize } from "@/domain/utils/sanitize";
import { parsePromotions } from "@/domain/entities/PromocionesUI";
import { ListaPromociones } from "./blocks/ListaPromociones";
import { AccionesRapidas } from "./blocks/AccionesRapidas";
import { AvisoDegradado } from "./blocks/AvisoDegradado";
import { BloqueError as BloqueErrorView } from "./blocks/BloqueError";
import { CarritoChat, FormularioRegistroChat, SelectorVarianteChat } from "./blocks/BloquesContenedores";
import { CarruselProductos } from "./blocks/CarruselProductos";
import { ConfirmacionPedido } from "./blocks/ConfirmacionPedido";
import { DetalleProducto } from "./blocks/DetalleProducto";
import { ResumenCheckout } from "./blocks/ResumenCheckout";
import { mensajePorCodigo } from "./chatPresentacion";
import { dividirResaltado } from "./resaltadoChat";
import { TextoMarkdown } from "./TextoMarkdown";
import type { AccionRapidaChat } from "./ChatWindow";

type Props = {
  texto: string;
  rol: "user" | "bot";
  /** Bloques del turno (SPEC-05 Req. 4); los tipos sin componente no se pintan. */
  bloques?: Bloque[];
  /** Respuesta en construcción: tokens llegando por SSE (efecto de escritura en vivo). */
  streaming?: boolean;
  /** First bot reply: Botleta introduction. */
  isFirstAssistant?: boolean;
  degradado?: boolean;
  motivoDegradado?: string;
  actionsBusy?: boolean;
  onQuickAction?: (accion: AccionRapidaChat) => void;
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

/**
 * Renderiza un bloque por tipo con los componentes existentes. Las acciones de los
 * bloques (agregar, ver detalle, elegir variante) salen por `onQuickAction`; el reenvío del
 * correo de confirmación llama al BFF desde el propio bloque. Los tipos sin forma definida en
 * `Bloque` no se pintan.
 */
export function renderBloque(
  bloque: Bloque,
  clave: number,
  onQuickAction?: (accion: AccionRapidaChat) => void,
  actionsBusy = false
): ReactNode {
  if (!bloque || typeof bloque !== "object") return null;
  if (esBloqueTexto(bloque)) {
    return <p key={clave} data-testid="bloque-texto">{renderChatText(bloque.texto)}</p>;
  }
  if (esBloqueError(bloque)) {
    return (
      <BloqueErrorView
        key={bloque.id || clave}
        code={bloque.code}
        mensaje={mensajePorCodigo(bloque.code)}
      />
    );
  }
  switch (bloque.tipo) {
    case "ACCIONES_RAPIDAS": {
      const b = parseQuickActions(bloque);
      if (!b || b.acciones.length === 0) return null;
      return (
        <div key={clave} data-testid="bloque-acciones-rapidas" className="mt-2">
          <AccionesRapidas
            pregunta={b.pregunta}
            acciones={b.acciones}
            onAccion={onQuickAction}
            busy={actionsBusy}
          />
        </div>
      );
    }
    case "LISTA_PROMOCIONES": {
      const items = parsePromotions((bloque as PromotionsBlock).datos?.promociones);
      return <div key={clave} className="mt-2"><ListaPromociones promos={items} unavailable={(bloque as PromotionsBlock).datos?.unavailable === true} /></div>;
    }
    case "DETALLE_PRODUCTO": {
      const detalle = detalleDeBloque(bloque as BloqueDetalle);
      if (!detalle) return null;
      return (
        <div key={clave} data-testid="bloque-detalle-producto" className="mt-2">
          <DetalleProducto p={detalle} />
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
      const productos = productosDeCarrusel(bloque as BloqueCarrusel);
      if (!productos) return null;
      return (
        // Inerte mientras otra acción está en curso (`onQuickAction` ausente).
        <div key={clave} data-testid="bloque-carrusel-productos" className="mt-2" inert={!onQuickAction}>
          <CarruselProductos
            {...carouselMetadata(bloque as BloqueCarrusel)}
            productos={productos}
            onAdd={(p) => onQuickAction?.(accionAgregarDeTarjeta(p))}
            onDetalle={(p) => onQuickAction?.(accionVerDetalle(p))}
          />
        </div>
      );
    }
    case "CARRITO": {
      const datos = datosDeCarrito(bloque as BloqueCarritoResumen);
      if (!datos) return null;
      return (
        <div key={clave} data-testid="bloque-carrito-chat" className="mt-2">
          <CarritoChat datos={datos} />
        </div>
      );
    }
    case "SELECTOR_VARIANTE": {
      const pedido = faltantesDeSelector(bloque as BloqueSelectorVariante);
      if (!pedido) return null;
      return (
        <div key={clave} className="mt-2">
          <SelectorVarianteChat
            productId={pedido.productId}
            faltantes={pedido.faltantes}
            seleccionInicial={pedido.seleccion}
            onAccion={onQuickAction}
          />
        </div>
      );
    }
    case "FORMULARIO": {
      if (!esFormularioRegistro(bloque as BloqueFormulario)) return null;
      return (
        <div key={clave} className="mt-2">
          <FormularioRegistroChat />
        </div>
      );
    }
    case "CONFIRMACION_PEDIDO": {
      const b = bloque as BloqueConfirmacion;
      const pedidoId = b.datos?.pedidoId ?? b.pedidoId ?? "";
      const correoEnmascarado = b.datos?.correoEnmascarado ?? b.correoEnmascarado ?? "";
      return (
        <div key={clave} data-testid="bloque-confirmacion-pedido" className="mt-2">
          <ConfirmacionPedido pedidoId={pedidoId} correoEnmascarado={correoEnmascarado} />
        </div>
      );
    }
    default:
      return null;
  }
}

/** Burbuja de mensaje. Todo texto pasa por sanitize (R7). */
export function MessageBubble({
  texto,
  rol,
  bloques = [],
  streaming = false,
  isFirstAssistant = false,
  degradado = false,
  motivoDegradado,
  onQuickAction,
  actionsBusy = false,
}: Props) {
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
      {degradado && <AvisoDegradado motivo={motivoDegradado} />}
      {texto && <TextoMarkdown texto={sanitize(texto)} />}
      {bloques.map((bloque, i) => renderBloque(bloque, i, onQuickAction, actionsBusy))}
      {streaming && <span data-testid="typing-indicator" aria-label="escribiendo" />}
    </div>
  );
}
