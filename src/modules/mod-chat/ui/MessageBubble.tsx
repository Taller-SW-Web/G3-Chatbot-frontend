"use client";
import type { ReactNode } from "react";
import type {
  Bloque,
  BloqueCarritoResumen,
  BloqueCarrusel,
  BloqueConfirmacion,
  BloqueConstanciaDevolucion,
  BloqueConstanciaReclamo,
  BloqueDetalle,
  BloqueError,
  BloqueEstadoDevolucion,
  BloqueEstadoPedido,
  BloqueEstadoReclamo,
  BloqueFormulario,
  BloqueListaDevoluciones,
  BloqueListaPedidos,
  BloqueListaReclamos,
  BloqueResumenCheckout,
  BloqueSelectorVariante,
  BloqueTexto,
  PromotionsBlock,
} from "@/modules/mod-chat/domain/entities/Bloque";
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
} from "@/modules/mod-chat/domain/utils/bloquesChat";
import { sanitize } from "@/shared/security/sanitize";
import { parsePromotions } from "@/modules/mod-catalog/public";
import { ListaPromociones } from "@/modules/mod-catalog/public";
import { AccionesRapidas } from "@/modules/mod-chat/ui/blocks/AccionesRapidas";
import { AvisoDegradado } from "@/modules/mod-chat/ui/blocks/AvisoDegradado";
import { BloqueError as BloqueErrorView } from "@/shared/ui/BloqueError";
import { CarritoChat, FormularioRegistroChat, SelectorVarianteChat } from "@/modules/mod-chat/ui/blocks/BloquesContenedores";
import { FormularioLoginChat, FormularioReenvioVerificacionChat } from "@/modules/mod-chat/ui/blocks/FormulariosAuthChat";
import { FormularioDevolucionChat, FormularioReclamoChat } from "@/modules/mod-chat/ui/blocks/FormulariosPostventaChat";
import { OtpCelularChatBlock } from "@/modules/mod-chat/ui/blocks/OtpCelularChatBlock";
import { CarruselProductos } from "@/modules/mod-catalog/public";
import { ConfirmacionPedido, EstadoPedido, ListaPedidos } from "@/modules/mod-orders/public";
import {
  ConstanciaDevolucion,
  ConstanciaReclamo,
  EstadoDevolucion,
  EstadoReclamo,
  ListaDevoluciones,
  ListaReclamos,
} from "@/modules/mod-postventa/public";
import { DetalleProducto } from "@/modules/mod-catalog/public";
import { ResumenCheckout } from "@/modules/mod-checkout/public";
import { mensajePorCodigo } from "@/modules/mod-chat/ui/chatPresentacion";
import { dividirResaltado } from "@/modules/mod-chat/ui/resaltadoChat";
import { TextoMarkdown } from "@/modules/mod-chat/ui/TextoMarkdown";
import { MessageAttachments } from "@/modules/mod-chat/ui/MessageAttachments";
import type { AdjuntoMensaje } from "@/modules/mod-chat/domain/entities/Adjunto";
import type { AccionRapidaChat } from "@/modules/mod-chat/ui/ChatWindow";

type Props = {
  texto: string;
  rol: "user" | "bot";
  /** Bloques del turno (SPEC-05 Req. 4); los tipos sin componente no se pintan. */
  bloques?: Bloque[];
  /** Imágenes del mensaje (SPEC-23). */
  adjuntos?: AdjuntoMensaje[];
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
            onSiguiente={(payload) => onQuickAction?.({ id: "BUSCAR_PAGINA", etiqueta: "Ver más", payload })}
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
      const formulario = bloque as BloqueFormulario;
      if (formulario.formulario === "OTP_CELULAR") {
        return (
          <div key={clave} className="mt-2" data-testid="bloque-otp-celular">
            <OtpCelularChatBlock celularEnmascarado={formulario.celularEnmascarado} />
          </div>
        );
      }
      if (formulario.formulario === "LOGIN") {
        return (
          <div key={clave} className="mt-2">
            <FormularioLoginChat />
          </div>
        );
      }
      if (formulario.formulario === "REENVIO_VERIFICACION") {
        return (
          <div key={clave} className="mt-2">
            <FormularioReenvioVerificacionChat />
          </div>
        );
      }
      if (formulario.formulario === "RECLAMO") {
        return (
          <div key={clave} className="mt-2" data-testid="bloque-formulario-reclamo">
            <FormularioReclamoChat
              datos={formulario.datos}
              onAccion={onQuickAction}
              busy={actionsBusy}
            />
          </div>
        );
      }
      if (formulario.formulario === "DEVOLUCION") {
        return (
          <div key={clave} className="mt-2" data-testid="bloque-formulario-devolucion">
            <FormularioDevolucionChat
              datos={formulario.datos}
              onAccion={onQuickAction}
              busy={actionsBusy}
            />
          </div>
        );
      }
      if (!esFormularioRegistro(formulario)) return null;
      return (
        <div key={clave} className="mt-2">
          <FormularioRegistroChat />
        </div>
      );
    }
    case "LISTA_PEDIDOS": {
      const b = bloque as BloqueListaPedidos;
      if (!Array.isArray(b.datos?.pedidos)) return null;
      return (
        <div key={clave} className="mt-2">
          <ListaPedidos
            pedidos={b.datos.pedidos}
            mensaje={b.datos.mensaje}
            onSeleccionar={onQuickAction
              ? (pedidoId) => onQuickAction({ id: "CONSULTAR_PEDIDOS", etiqueta: "Ver pedido", payload: { pedidoId } })
              : undefined}
          />
        </div>
      );
    }
    case "ESTADO_PEDIDO": {
      const b = bloque as BloqueEstadoPedido;
      if (!b.datos || !Array.isArray(b.datos.hitos)) return null;
      const seguimiento = b.datos.seguimiento && Array.isArray(b.datos.seguimiento.hitos)
        ? b.datos.seguimiento
        : undefined;
      return (
        <div key={clave} className="mt-2">
          <EstadoPedido pedido={b.datos.pedido} hitos={b.datos.hitos} seguimiento={seguimiento} />
        </div>
      );
    }
    case "LISTA_RECLAMOS": {
      const b = bloque as BloqueListaReclamos;
      if (!Array.isArray(b.datos?.reclamos)) return null;
      return (
        <div key={clave} className="mt-2">
          <ListaReclamos
            reclamos={b.datos.reclamos}
            onSeleccionar={onQuickAction
              ? (codigoSeguimiento) => onQuickAction({ id: "CONSULTAR_RECLAMO", etiqueta: "Ver reclamo", payload: { codigoSeguimiento } })
              : undefined}
          />
        </div>
      );
    }
    case "ESTADO_RECLAMO": {
      const b = bloque as BloqueEstadoReclamo;
      if (!b.datos || typeof b.datos.codigoSeguimiento !== "string") return null;
      return (
        <div key={clave} className="mt-2">
          <EstadoReclamo datos={b.datos} />
        </div>
      );
    }
    case "CONSTANCIA_RECLAMO": {
      const b = bloque as BloqueConstanciaReclamo;
      if (!b.datos || typeof b.datos.codigoSeguimiento !== "string") return null;
      return (
        <div key={clave} className="mt-2">
          <ConstanciaReclamo datos={b.datos} />
        </div>
      );
    }
    case "LISTA_DEVOLUCIONES": {
      const b = bloque as BloqueListaDevoluciones;
      if (!Array.isArray(b.datos?.devoluciones)) return null;
      return (
        <div key={clave} className="mt-2">
          <ListaDevoluciones
            devoluciones={b.datos.devoluciones}
            onSeleccionar={onQuickAction
              ? (devolucionId) => onQuickAction({ id: "CONSULTAR_DEVOLUCION", etiqueta: "Ver solicitud", payload: { devolucionId } })
              : undefined}
          />
        </div>
      );
    }
    case "ESTADO_DEVOLUCION": {
      const b = bloque as BloqueEstadoDevolucion;
      if (!b.datos || typeof b.datos.devolucionId !== "string") return null;
      return (
        <div key={clave} className="mt-2">
          <EstadoDevolucion datos={b.datos} />
        </div>
      );
    }
    case "CONSTANCIA_DEVOLUCION": {
      const b = bloque as BloqueConstanciaDevolucion;
      if (!b.datos || typeof b.datos.devolucionId !== "string") return null;
      return (
        <div key={clave} className="mt-2">
          <ConstanciaDevolucion datos={b.datos} />
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
  adjuntos = [],
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
        {texto && <p>{renderChatText(texto, true)}</p>}
        {adjuntos.length > 0 && <MessageAttachments adjuntos={adjuntos} />}
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
      {adjuntos.length > 0 && <MessageAttachments adjuntos={adjuntos} />}
      {bloques.map((bloque, i) => renderBloque(bloque, i, onQuickAction, actionsBusy))}
      {streaming && (
        <span data-testid="typing-indicator" aria-label="escribiendo" className="inline-flex items-center gap-1 ml-1.5 align-middle">
          <span className="tdot" style={{ animationDelay: "0ms" }} />
          <span className="tdot" style={{ animationDelay: "200ms" }} />
          <span className="tdot" style={{ animationDelay: "400ms" }} />
        </span>
      )}
    </div>
  );
}
