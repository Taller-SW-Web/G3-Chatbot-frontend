"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpIcon, PhotoIcon } from "../components/icons";
import { ProductCard } from "../components/ProductCard";
import { AttachmentPopup } from "../components/AttachmentPopup";
import {
  formatPrice,
  toAvailabilityState,
  type CatalogCardItem,
  type CatalogDetail,
} from "@/domain/entities/CatalogoUI";
import { isUnavailable, problemCode } from "@/domain/utils/httpError";
import { useChatStore } from "@/application/state/chatStore";
import {
  ModalShell,
  ProductDetailModal,
} from "../components/blocks/DetalleProducto";
import { buscarProductosUseCase } from "@/application/use_cases/buscarProductosUseCase";
import { verDetalleProductoUseCase } from "@/application/use_cases/verDetalleProductoUseCase";
import { consultarDisponibilidadUseCase } from "@/application/use_cases/consultarDisponibilidadUseCase";
import { agregarProductoAlCarritoUseCase } from "@/application/use_cases/agregarProductoAlCarritoUseCase";
import { container } from "@/infrastructure/di/container";

/** `/`: banner ofertas, grid en oferta, campo chat inferior. SPEC-05 Req.2, SPEC-06,08,09 */
export function HomePage() {
  const router = useRouter();
  const [banner, setBanner] = useState(0);
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [composer, setComposer] = useState("");
  const [attach, setAttach] = useState(false);
  const carrito = useChatStore((s) => s.carrito);
  const setCarrito = useChatStore((s) => s.setCarrito);
  const setMensajePendiente = useChatStore((s) => s.setMensajePendiente);

  // Grid con datos reales (SPEC-06). Sin fallback a mocks en este flujo.
  const catalogo = useQuery({
    queryKey: ["catalogo", "ofertas"],
    queryFn: () => buscarProductosUseCase(container.api, { pagina: 1, tamanio: 10 }),
  });
  const productos: CatalogCardItem[] = catalogo.data?.items ?? [];

  const detalleQuery = useQuery({
    queryKey: ["catalogo", "detalle", detalleId],
    queryFn: () => verDetalleProductoUseCase(container.api, detalleId as string),
    enabled: detalleId != null,
  });
  const detalle: CatalogDetail | null = detalleQuery.data ?? null;

  async function agregarDesdeDetalle(
    item: CatalogCardItem,
    sel: { sku: string | null; talla: string | null; color: string | null }
  ) {
    if (sel.sku == null) return;
    await agregarProductoAlCarritoUseCase(container.api, { sku: sel.sku, cantidad: 1 });
    const found = carrito.lineas.find((l) => l.producto.sku === sel.sku);
    const lineas = found
      ? carrito.lineas.map((l) => (l.producto.sku === sel.sku ? { ...l, cantidad: Math.min(10, l.cantidad + 1) } : l))
      : [...carrito.lineas, { producto: { sku: sel.sku, nombre: item.name, categoria: item.brand ?? "Catálogo", talla: sel.talla ?? "", color: sel.color ?? "", precio: item.price, stock: 5 }, cantidad: 1 }];
    const subtotal = lineas.reduce((a, l) => a + l.cantidad * l.producto.precio, 0);
    setCarrito({ lineas, subtotal, count: lineas.reduce((a, l) => a + l.cantidad, 0) });
    // Botleta confirma en el chat lo agregado (paridad mockup).
    setMensajePendiente({
      bot: `Agregué ${item.name} (${formatPrice(item)}). Tu carrito se actualizó.`,
    });
    setDetalleId(null);
    router.push("/chat/talla-42");
  }

  function irChat(texto?: string) {
    if (!texto?.trim()) return;
    if (texto.toLowerCase().includes("oferta")) router.push("/chat/ofertas-q");
    else if (texto.toLowerCase().includes("pedido") || texto.toLowerCase().includes("rastrea")) router.push("/chat/estado-pedido");
    else router.push("/chat/talla-42");
  }

  function sendPhoto(nombreArchivo = "evidencia.jpg") {
    setMensajePendiente({
      user: `📷 Foto enviada: ${nombreArchivo}`,
      bot: "Foto recibida. ¿En qué te ayudo con ella?",
    });
    router.push("/chat/consulta");
  }

  return (
    <div className="p-4 flex flex-col gap-4 pb-24">
      <button onClick={() => irChat("Ver ofertas")}
        className="relative overflow-hidden rounded-lg w-full text-left bg-surface-ink text-text-inverse px-4 pt-5 pb-6"
        aria-label="Ver ofertas Inka Athletics">
        <span aria-hidden className="absolute inset-0 opacity-60" style={{
          background: "repeating-linear-gradient(115deg, transparent 0 40px, rgba(247,103,7,.14) 40px 42px, transparent 42px 90px, rgba(195,229,4,.10) 90px 92px)",
        }} />
        <span className="relative flex flex-col gap-2">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-accent-volt-soft px-2.5 py-1 text-[11px] font-bold text-accent-volt-ink">
            <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-current" />OFERTAS DE LA SEMANA
          </span>
          <span className="font-heading text-[28px] leading-[32px]">ENCUENTRA TU<br /><span className="text-action-primary">PRÓXIMA META</span></span>
          <span className="inka-energy-bar" aria-hidden />
          <span className="text-[14px] text-text-inverse-soft">Equípate para dar tu mejor paso. Stock verificado.</span>
          <span className="mt-1 inline-flex w-fit items-center gap-2 rounded-sm bg-action-primary px-4 py-2.5 text-[13px] font-bold tracking-wide text-surface-ink">VER OFERTAS →</span>
        </span>
        <span className="absolute bottom-2 right-2 rounded-full bg-surface-ink-soft border border-border-inverse px-2 py-0.5 text-[11px] font-bold text-text-inverse">{banner + 1} / 4</span>
      </button>
      <div className="flex justify-center gap-1.5 -mt-2">
        {[0, 1, 2, 3].map((i) => (
          <button key={i} aria-label={`Banner ${i + 1}`} onClick={() => setBanner(i)}
            className={`h-2 rounded-full transition-all ${i === banner ? "w-6 bg-surface-ink" : "w-2 bg-border-default"}`} />
        ))}
      </div>

      <div className="flex items-end justify-between">
        <h2 className="font-heading text-[24px] leading-[32px]">PRODUCTOS EN OFERTA</h2>
        <button className="text-[12px] font-semibold underline text-text-secondary" onClick={() => irChat("Ver todo en oferta")}>Ver todo</button>
      </div>

      {catalogo.isPending && <p className="text-[13px] text-text-secondary">Cargando productos…</p>}
      {catalogo.isError && (
        <div className="text-[13px] text-text-secondary rounded-md bg-white border border-border-default p-3 flex flex-col gap-2">
          <p>
            {isUnavailable(catalogo.error)
              ? "El catálogo no está disponible ahora (servicio o red). Revisa tu conexión e intenta de nuevo."
              : "No pudimos cargar el catálogo."}
          </p>
          <button
            onClick={() => void catalogo.refetch()}
            className="wf-chip w-fit px-3 py-1.5 text-[12px] font-semibold text-text-primary"
          >
            Reintentar
          </button>
        </div>
      )}
      {!catalogo.isPending && !catalogo.isError && productos.length === 0 && (
        <p className="text-[13px] text-text-secondary rounded-md bg-white border border-border-default p-3">
          No hay productos para mostrar ahora mismo.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {productos.map((p) => (
          <ProductCard key={p.product_id} producto={p} onDetalle={(item) => setDetalleId(item.product_id)} />
        ))}
      </div>

      <p className="text-[12px] text-text-secondary rounded-md bg-white border border-border-default p-3">
        Conversas con un asistente virtual con IA. No compartas contraseñas ni datos de tarjeta en el chat. <span className="underline">Política de privacidad</span>
      </p>

      <div className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-2">
        <p className="font-heading text-[15px] tracking-[0.06em] uppercase text-text-primary">Acciones rápidas</p>
        <p className="text-[14px] text-text-secondary">Todo listo para seguir avanzando.</p>
        <div className="flex flex-wrap gap-2">
          {["Ver ofertas", "Rastrear pedido", "Ayuda con devolución"].map((q) => (
            <button key={q} onClick={() => irChat(q)} className="wf-chip px-3 py-1.5 text-[12px] font-semibold text-text-primary hover:border-accent-signal">{q}</button>
          ))}
        </div>
      </div>
      <p className="text-[12px] text-text-secondary">Toca + para elegir talla y color antes de agregar.</p>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] border-t border-border-default bg-surface-cloud px-3 py-3 flex items-center gap-2">
        <button aria-label="Agregar imagen" onClick={() => setAttach(true)}
          className="w-10 h-10 wf-btn flex items-center justify-center bg-surface-ink-soft text-text-inverse border border-border-inverse"><PhotoIcon size={20} /></button>
        <input value={composer} maxLength={1000} onChange={(e) => setComposer(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { irChat(composer); setComposer(""); } }}
          placeholder="Pregunta por zapatillas, tallas, pedidos…"
          className="flex-1 wf-chip px-4 py-2.5 text-sm outline-none min-w-0 bg-white text-text-primary placeholder:text-text-secondary" />
        <button aria-label="Enviar" onClick={() => { irChat(composer); setComposer(""); }}
          className="w-10 h-10 wf-btn flex items-center justify-center bg-surface-ink-soft text-text-inverse border border-border-inverse"><ArrowUpIcon size={20} /></button>
      </div>

      {detalleId != null && detalleQuery.isPending && (
        <ModalShell title="Detalle de producto" onClose={() => setDetalleId(null)}>
          <p data-testid="detalle-cargando" className="text-[13px] text-text-secondary">
            Cargando detalle…
          </p>
        </ModalShell>
      )}
      {detalleId != null && detalleQuery.isError && (
        <ModalShell title="Detalle de producto" onClose={() => setDetalleId(null)}>
          <p data-testid="detalle-error" className="text-[13px] text-text-secondary">
            {problemCode(detalleQuery.error) === "PRODUCTO_NO_DISPONIBLE"
              ? "Producto no disponible."
              : isUnavailable(detalleQuery.error)
                ? "No pudimos cargar el detalle. Revisa tu conexión e intenta de nuevo."
                : "No pudimos cargar el detalle del producto."}
          </p>
          <button
            onClick={() => void detalleQuery.refetch()}
            className="wf-chip py-2 text-[13px] font-bold text-text-primary"
          >
            Reintentar
          </button>
        </ModalShell>
      )}
      {detalleId != null && detalle != null && (
        <ProductDetailModal
          p={detalle}
          onClose={() => setDetalleId(null)}
          onAdd={(sel) => {
            const item = productos.find((c) => c.product_id === detalleId);
            if (item) void agregarDesdeDetalle(item, sel);
          }}
          consultarDisponibilidad={(sku) =>
            consultarDisponibilidadUseCase(container.api, { sku }).then((r) =>
              toAvailabilityState(r.status)
            )
          }
        />
      )}
      {attach && <AttachmentPopup onClose={() => setAttach(false)} onSend={(n) => { setAttach(false); sendPhoto(n); }} />}
    </div>
  );
}
