"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpIcon, PhotoIcon } from "../components/icons";
import { ChatWindow, type UIMsg } from "../components/ChatWindow";
import { CarruselProductos } from "../components/blocks/CarruselProductos";
import { AttachmentPopup } from "../components/AttachmentPopup";
import { useChatStore } from "@/application/state/chatStore";
import {
  CHAT_CARDS_MOCK,
  MOCK_SEEDS,
  CHAT_INICIAL_SEED,
  type SeedMsg,
} from "@/adapters/outbound/mockData";
import type { CatalogCardItem } from "@/domain/entities/CatalogoUI";
import type { ProductoUI } from "@/domain/entities/ProductoUI";
import { ProductDetailModal } from "../components/blocks/DetalleProducto";

type Flow = null | "ofertas" | "rastrear" | "devolucion" | "devolucion-foto";

/** Flujo de preguntas que se arma al abrir ciertas semillas (tras login o quick reply). */
const FLOW_POR_SEED: Record<string, Flow> = {
  "rastrear-q": "rastrear",
  "rastrear-continue": "rastrear",
  "devolucion-q": "devolucion",
  "devolucion-continue": "devolucion",
};

const SEGUIMIENTO = { etiqueta: "Ver seguimiento del pedido", href: "/seguimiento" };
const FORM_DEVOLUCION = { etiqueta: "Ir al formulario de devolución", href: "/devolucion" };

function seedToUI(s: SeedMsg): UIMsg {
  if (s.from === "user") return { from: "user", text: s.text };
  if (s.from === "bot")
    return {
      from: "bot",
      text: s.text,
      accion: s.accion ? { etiqueta: s.accion.etiqueta, href: s.accion.href } : undefined,
    };
  if (s.from === "bot-cards") return { from: "bot-cards" };
  return { from: "bot-login" };
}

/**
 * `/chat/[id]`: historial semilla wireframe + mensajes vivos de la sesión.
 * Sin backend los flujos viven aquí (paridad mockup); con backend el
 * historial vendrá del store vía useChat. Nunca importa Axios/fetch.
 */
export function ChatPage({ conversationId = "talla-42" }: { conversationId?: string }) {
  const router = useRouter();
  const cliente = useChatStore((s) => s.cliente);
  const carrito = useChatStore((s) => s.carrito);
  const setCarrito = useChatStore((s) => s.setCarrito);
  const setAccionPendiente = useChatStore((s) => s.setAccionPendiente);
  const setAuthOpen = useChatStore((s) => s.setAuthOpen);
  const mensajePendiente = useChatStore((s) => s.mensajePendiente);
  const setMensajePendiente = useChatStore((s) => s.setMensajePendiente);

  // Mensaje sembrado por otra página (confirm al agregar, preguntar en el chat).
  const [extra, setExtra] = useState<UIMsg[]>(() => {
    if (!mensajePendiente) return [];
    const par: UIMsg[] = [];
    if (mensajePendiente.user) par.push({ from: "user", text: mensajePendiente.user });
    par.push({ from: "bot", text: mensajePendiente.bot });
    return par;
  });
  const [flow, setFlow] = useState<Flow>(FLOW_POR_SEED[conversationId] ?? null);
  const [composer, setComposer] = useState("");
  const [typing, setTyping] = useState(false);
  const [detalle, setDetalle] = useState<CatalogCardItem | null>(null);
  const [attach, setAttach] = useState(false);

  // El mensaje ya se copió al estado inicial; se consume para no repetirlo.
  useEffect(() => {
    if (mensajePendiente) setMensajePendiente(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const base: UIMsg[] =
    conversationId === "consulta"
      ? []
      : (MOCK_SEEDS[conversationId] ?? CHAT_INICIAL_SEED).map(seedToUI);
  const msgs = [...base, ...extra];

  function pedirLogin(pendienteHref: string) {
    setAccionPendiente(pendienteHref);
    setAuthOpen(true);
  }

  function irAccion(href: string) {
    if (cliente) router.push(href);
    else pedirLogin(href);
  }

  function agregarAlCarrito(p: { nombre: string; precio: number; talla: string; color: string; sku: string }) {
    const prod: ProductoUI = { sku: p.sku, nombre: p.nombre, categoria: "Calzado deportivo", talla: p.talla, color: p.color, precio: p.precio, stock: 5 };
    const found = carrito.lineas.find((l) => l.producto.sku === prod.sku);
    const lineas = found
      ? carrito.lineas.map((l) => (l.producto.sku === prod.sku ? { ...l, cantidad: Math.min(10, l.cantidad + 1) } : l))
      : [...carrito.lineas, { producto: prod, cantidad: 1 }];
    setCarrito({ lineas, subtotal: lineas.reduce((a, l) => a + l.cantidad * l.producto.precio, 0), count: lineas.reduce((a, l) => a + l.cantidad, 0) });
    setExtra((m) => [...m, { from: "bot", text: `Listo, agregué ${p.nombre} (S/ ${p.precio}.00) al carrito. Lo verás en el Carrito con el badge actualizado.` }]);
  }

  function responder(nuevos: UIMsg[], proximoFlow: Flow = null) {
    setTyping(true);
    const espera = setTimeout(() => {
      setTyping(false);
      setFlow(proximoFlow);
      setExtra((m) => [...m, ...nuevos]);
    }, 900);
    return () => clearTimeout(espera);
  }

  function send(texto?: string) {
    const t = (texto ?? composer).trim();
    if (!t || typing) return;
    setExtra((m) => [...m, { from: "user", text: t }]);
    setComposer("");
    const actual = flow;
    if (actual === "ofertas") {
      responder([
        { from: "bot", text: `Perfecto, busqué ofertas de "${t}" con stock verificado:` },
        { from: "bot-cards" },
      ]);
    } else if (actual === "rastrear") {
      responder([
        { from: "bot", text: `Con tu descripción ("${t}") encontré tu pedido #A-1042: Zapatilla Runner blanca, talla 41.` },
        { from: "bot", text: "Estado: EN CAMINO · Entrega estimada 18 sep 2026 · Av. Siempre Viva 742, Lima. Más detalle en Historial de pedidos → En proceso.", accion: SEGUIMIENTO },
      ]);
    } else if (actual === "devolucion") {
      responder(
        [{ from: "bot", text: "Te preparé el formulario de devolución con esos datos. Sube la evidencia desde el formulario y pulsa Enviar solicitud para registrarlo.", accion: FORM_DEVOLUCION }],
        "devolucion-foto"
      );
    } else if (actual === "devolucion-foto") {
      responder([
        { from: "bot", text: "Recibí tu foto en el chat, pero las imágenes del chat no se reutilizan como evidencia. Complétala en el formulario y pulsa Enviar solicitud.", accion: FORM_DEVOLUCION },
      ]);
    } else {
      const low = t.toLowerCase();
      if (low.includes("reclam")) {
        responder([
          { from: "bot", text: "Aviso: ya tienes el reclamo REC-2026-0118 En revisión por ese pedido. Puedes ver su estado o registrar uno nuevo de todas formas.", accion: { etiqueta: "Ir al formulario de reclamo", href: "/reclamo" } },
          { from: "bot-cards" },
        ]);
      } else if (low.includes("devol")) {
        responder([
          { from: "bot", text: "Aviso: ya tienes la solicitud DEV-2026-0042 En revisión por ese pedido. Puedes ver su estado o registrar una nueva de todas formas.", accion: FORM_DEVOLUCION },
          { from: "bot-cards" },
        ]);
      } else if (low.includes("cambi")) {
        responder([
          { from: "bot", text: "Aviso: ya tienes el cambio DEV-2026-0042 en curso por ese pedido. Puedes ver su estado o registrar uno nuevo de todas formas.", accion: { etiqueta: "Ir al formulario de cambio", href: "/devolucion" } },
          { from: "bot-cards" },
        ]);
      } else if (low.includes("pedido") || low.includes("rastrea") || low.includes("seguimiento") || low.includes("donde") || low.includes("dónde") || low.includes("estado") || low.includes("consult")) {
        responder([
          { from: "bot", text: "Tu pedido #A-1042 está EN CAMINO · Entrega estimada 18 sep 2026 · Av. Siempre Viva 742, Lima.", accion: SEGUIMIENTO },
        ]);
      } else {
        responder([
          { from: "bot", text: "Entendido. Te muestro opciones con stock verificado." },
          { from: "bot-cards" },
        ]);
      }
    }
  }

  function quick(t: string) {
    const low = t.toLowerCase();
    if (low.includes("oferta") || low.includes("ver todo")) {
      router.push("/chat/ofertas-q");
      return;
    }
    if (low.includes("rastrea") || low.includes("pedido") || low.includes("seguimiento")) {
      if (!cliente) {
        setExtra((m) => [
          ...m,
          { from: "user", text: "Quiero rastrear mi pedido" },
          { from: "bot-login" },
        ]);
        return;
      }
      router.push("/chat/rastrear-q");
      return;
    }
    if (low.includes("devolu") || low.includes("cambio") || low.includes("ayuda")) {
      if (!cliente) {
        setExtra((m) => [
          ...m,
          { from: "user", text: "Necesito ayuda con una devolución" },
          { from: "bot-login" },
        ]);
        return;
      }
      router.push("/chat/devolucion-q");
    }
  }

  function sendPhoto(nombreArchivo = "evidencia.jpg") {
    setExtra((m) => [...m, { from: "user", text: `📷 Foto enviada: ${nombreArchivo}` }]);
    const actual = flow;
    if (actual === "devolucion" || actual === "devolucion-foto") {
      responder([
        { from: "bot", text: "Recibí tu foto en el chat, pero las imágenes del chat no se reutilizan como evidencia. Complétala en el formulario de devolución y pulsa Enviar solicitud.", accion: FORM_DEVOLUCION },
      ]);
    } else {
      responder([{ from: "bot", text: "Foto recibida. ¿En qué te ayudo con ella?" }]);
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1">
        <ChatWindow
          msgs={msgs}
          typing={typing}
          sesionActiva={!!cliente}
          onAccion={irAccion}
          cards={() => (
            <CarruselProductos
              titulo="Estas son mis recomendaciones para ti:"
              productos={CHAT_CARDS_MOCK.map((c, i) => ({
                ref: i + 1,
                product_id: c.sku,
                sku: c.sku,
                name: c.nombre,
                price: c.precio,
                hasVariants: false,
                availability: "DISPONIBLE" as const,
                talla: c.talla,
                color: c.color,
              }))}
              onAdd={(p) => agregarAlCarrito({ nombre: p.name, precio: p.price, talla: p.talla ?? "", color: p.color ?? "", sku: p.sku ?? p.product_id })}
              onDetalle={(p) => setDetalle(p)}
            />
          )}
          loginSlot={() => (
            <div className="msg-in self-start w-full max-w-[85%] rounded-md rounded-bl-xs p-3 bg-white border border-border-default flex flex-col gap-2 wf-card">
              <p className="text-[14px] text-text-primary">Inicia sesión para continuar con tu consulta.</p>
              <button
                onClick={() => pedirLogin("/chat/rastrear-continue")}
                className="wf-btn py-2.5 text-[13px] font-bold tracking-wide bg-action-primary text-surface-ink hover:bg-action-primary-hover"
              >
                INICIAR SESIÓN
              </button>
            </div>
          )}
        />
        <div className="px-3 flex flex-wrap gap-2 pb-24">
          {["Ver ofertas", "Rastrear pedido", "Ayuda con devolución"].map((q) => (
            <button key={q} onClick={() => quick(q)} className="wf-chip px-3 py-1.5 text-[12px] font-semibold bg-white text-text-primary hover:border-accent-signal">{q}</button>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] border-t border-border-default bg-surface-cloud px-3 py-3 flex items-center gap-2">
        <button aria-label="Agregar imagen" onClick={() => setAttach(true)}
          className="w-10 h-10 wf-btn flex items-center justify-center bg-surface-ink-soft text-text-inverse border border-border-inverse"><PhotoIcon size={20} /></button>
        <input value={composer} maxLength={1000} disabled={typing}
          onChange={(e) => setComposer(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          placeholder="Pregunta por zapatillas, tallas, pedidos…"
          className="flex-1 wf-chip px-4 py-2.5 text-sm outline-none min-w-0 bg-white text-text-primary placeholder:text-text-secondary disabled:opacity-60" />
        <button aria-label="Enviar" onClick={() => send()}
          className="w-10 h-10 wf-btn flex items-center justify-center bg-surface-ink-soft text-text-inverse border border-border-inverse"><ArrowUpIcon size={20} /></button>
      </div>

      {detalle && (
        <ProductDetailModal
          p={{
            product_id: detalle.product_id,
            name: detalle.name,
            brand: detalle.brand,
            shortDescription: detalle.shortDescription,
            image: detalle.image,
            price: detalle.price,
            priceText: detalle.priceText,
            hasVariants: false,
            singleSku: detalle.sku,
            availability: "DISPONIBLE",
            variants: detalle.sku ? [{ sku: detalle.sku, talla: detalle.talla ?? null, color: detalle.color ?? null }] : [],
            tallas: detalle.talla ? [detalle.talla] : [],
            colores: detalle.color ? [detalle.color] : [],
          }}
          onClose={() => setDetalle(null)}
          onAdd={(d) => { agregarAlCarrito({ nombre: detalle.name, precio: detalle.price, talla: d.talla ?? "", color: d.color ?? "", sku: d.sku ?? detalle.sku ?? detalle.product_id }); setDetalle(null); }}
        />
      )}
      {attach && <AttachmentPopup onClose={() => setAttach(false)} onSend={(n) => { setAttach(false); sendPhoto(n); }} />}
    </div>
  );
}
