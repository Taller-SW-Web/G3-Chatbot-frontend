"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpIcon, PhotoIcon } from "@/shared/ui/icons";
import { ProductCard } from "@/modules/mod-catalog/ui/ProductCard";
import {
  toAvailabilityState,
  canAddCard,
  type CatalogCardItem,
  type CatalogDetail,
} from "@/modules/mod-catalog/domain/entities/CatalogoUI";
import { isUnavailable, problemCode } from "@/shared/api/httpError";
import {
  ModalShell,
  ProductDetailModal,
} from "@/modules/mod-catalog/ui/blocks/DetalleProducto";
import { buscarProductosUseCase } from "@/modules/mod-catalog/application/buscarProductosUseCase";
import { verDetalleProductoUseCase } from "@/modules/mod-catalog/application/verDetalleProductoUseCase";
import { consultarDisponibilidadUseCase } from "@/modules/mod-catalog/application/consultarDisponibilidadUseCase";
import {
  ORDEN_CATALOGO_POR_DEFECTO,
  ordenParaApi,
  type OrdenCatalogo,
} from "@/modules/mod-catalog/domain/entities/OrdenCatalogo";
import { SelectorOrden } from "@/modules/mod-catalog/ui/SelectorOrden";
import { container } from "@/shared/di/container";

/** Producto y variante elegidos para agregar desde la home. */
export type HomeAgregarInput = {
  item: CatalogCardItem;
  sel: { sku: string | null; talla: string | null; color: string | null };
};

/** Resultado ya traducido a texto visible por el composition root. */
export type HomeAgregarResultado =
  | { ok: true; mensaje: string }
  | { ok: false; mensaje: string };

export type HomePageProps = {
  /** Agrega al carrito (la conversación anónima la resuelve el route file). */
  onAgregar: (input: HomeAgregarInput) => Promise<HomeAgregarResultado>;
  /** Crea la conversación y navega al chat; rechaza si no se pudo. */
  onAbrirChat: (texto: string) => Promise<void>;
  /** Límite del compositor (hoy vive en el contrato de mod-chat). */
  mensajeMaxCaracteres: number;
};

/** `/`: banner ofertas, grid en oferta, campo chat inferior. SPEC-05 Req.2, SPEC-06,08,09 */
export function HomePage({ onAgregar, onAbrirChat, mensajeMaxCaracteres }: HomePageProps) {
  const [banner, setBanner] = useState(0);
  const [orden, setOrden] = useState<OrdenCatalogo>(ORDEN_CATALOGO_POR_DEFECTO);
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [composer, setComposer] = useState("");
  const [creando, setCreando] = useState(false);
  /** Texto cuyo intento de crear la conversación falló, para reintentarlo. */
  const [fallido, setFallido] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [agregado, setAgregado] = useState<string | null>(null);
  const [agregando, setAgregando] = useState(false);
  /** Gesto táctil del banner: horizontal cambia de slide, el clic posterior no navega. */
  const swipeBanner = useRef<{ x: number; y: number; id: number } | null>(null);
  const swipeConsumido = useRef(false);

  // Grid con datos reales (SPEC-06). Sin fallback a mocks en este flujo.
  const catalogo = useQuery({
    queryKey: ["catalogo", "ofertas", orden],
    queryFn: () =>
      buscarProductosUseCase(container.catalogo, {
        pagina: 1,
        tamanio: 10,
        soloOfertas: true,
        ...(ordenParaApi(orden) ? { orden } : {}),
      }),
  });
  const productos: CatalogCardItem[] = catalogo.data?.items ?? [];

  const detalleQuery = useQuery({
    queryKey: ["catalogo", "detalle", detalleId],
    queryFn: () => verDetalleProductoUseCase(container.catalogo, detalleId as string),
    enabled: detalleId != null,
  });
  const detalle: CatalogDetail | null = detalleQuery.data ?? null;

  // SPEC-09 Req. 2 "agregar desde la tarjeta": la línea la crea el backend con
  // nombre, imagen e id reales. El carrito y la conversación anónima los resuelve
  // `app/page.tsx`; aquí solo se pinta el resultado y se cierra el detalle.
  async function agregarItem(input: HomeAgregarInput) {
    if (agregando) return;
    setAgregando(true);
    try {
      const resultado = await onAgregar(input);
      if (resultado.ok) {
        setAviso(null);
        setAgregado(resultado.mensaje);
        setDetalleId(null);
      } else {
        setAgregado(null);
        setAviso(resultado.mensaje);
      }
    } finally {
      setAgregando(false);
    }
  }

  /** Deja el texto al route file, que crea la conversación y navega al chat. */
  async function irChat(texto?: string) {
    const limpio = texto?.trim();
    if (!limpio || limpio.length > mensajeMaxCaracteres || creando) return;
    setCreando(true);
    setFallido(null);
    try {
      await onAbrirChat(limpio);
      setComposer("");
    } catch {
      setFallido(limpio);
    } finally {
      setCreando(false);
    }
  }

  /** Swipe horizontal sobre el banner: siguiente/anterior slide sin salir de la home. */
  function onBannerPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    if (e.pointerType === "mouse" && e.buttons !== 1) return;
    swipeBanner.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
  }

  function onBannerPointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    const inicio = swipeBanner.current;
    swipeBanner.current = null;
    if (!inicio || inicio.id !== e.pointerId) return;
    const dx = e.clientX - inicio.x;
    const dy = e.clientY - inicio.y;
    if (Math.abs(dx) < 50 || Math.abs(dx) <= Math.abs(dy)) return;
    swipeConsumido.current = true;
    setBanner((actual) => (dx < 0 ? (actual + 1) % 4 : (actual + 3) % 4));
  }

  function abrirOfertas() {
    if (swipeConsumido.current) {
      swipeConsumido.current = false;
      return;
    }
    void irChat("Ver ofertas");
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto no-scrollbar p-4">
        {aviso && (
          <p role="alert" aria-live="assertive" className="rounded-md bg-error-soft border border-error-default px-3 py-2.5 text-[13px]">
            {aviso}
          </p>
        )}
        {agregado && (
          <p role="status" aria-live="polite" className="rounded-md bg-white border border-border-default px-3 py-2.5 text-[13px]">
            {agregado}
          </p>
        )}
        <button onClick={abrirOfertas} disabled={creando}
          data-testid="banner-ofertas"
          onPointerDown={onBannerPointerDown}
          onPointerUp={onBannerPointerUp}
          onPointerCancel={() => { swipeBanner.current = null; }}
          style={{ touchAction: "pan-y" }}
          className="relative shrink-0 overflow-hidden rounded-lg w-full text-left bg-surface-ink text-text-inverse px-4 pt-5 pb-6"
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
            <span className="text-[14px] text-text-inverse-soft">Equípate para dar tu mejor paso. Consulta disponibilidad.</span>
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
          <button className="text-[12px] font-semibold underline text-text-secondary" disabled={creando} onClick={() => void irChat("Ver todo en oferta")}>Ver todo</button>
        </div>
        <SelectorOrden
          value={orden}
          onChange={setOrden}
          disabled={catalogo.isFetching || catalogo.isPending}
        />

        {catalogo.isPending && (
          <div
            role="status"
            aria-label="Cargando productos en oferta"
            className="grid grid-cols-2 gap-3 screen-enter"
          >
            <p className="sr-only">Cargando productos…</p>
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="rounded-md bg-white border border-border-default p-2 flex flex-col gap-2 wf-card"
              >
                <div className="h-28 w-full rounded-md shimmer" />
                <div className="h-3 w-16 rounded shimmer" />
                <div className="h-5 w-3/4 rounded shimmer" />
                <div className="h-4 w-20 rounded shimmer" />
                <div className="h-4 w-14 rounded-full shimmer" />
              </div>
            ))}
          </div>
        )}
        {catalogo.isError && (
          <div role="alert" className="text-[13px] text-text-secondary rounded-md bg-white border border-border-default p-3 flex flex-col gap-2">
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
        {catalogo.data?.partial && (
          <p role="status" className="text-[13px] text-text-secondary">Mostramos parte de los resultados. No pudimos consultar todos los datos ahora.</p>
        )}
        {!catalogo.isPending && !catalogo.isError && !catalogo.data?.partial && productos.length === 0 && (
          <p className="text-[13px] text-text-secondary rounded-md bg-white border border-border-default p-3">
            No hay productos en oferta ahora mismo.
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          {productos.map((p) => (
            <ProductCard key={p.product_id} producto={p} onDetalle={(item) => setDetalleId(item.product_id)}
              onAdd={(item) => {
                if (canAddCard(item) && item.sku && !agregando) {
                  void agregarItem({ item, sel: { sku: item.sku, talla: null, color: null } });
                }
              }} />
          ))}
        </div>

        <p className="text-[12px] text-text-secondary rounded-md bg-white border border-border-default p-3">
          Conversas con un asistente virtual con IA. No compartas contraseñas ni datos de tarjeta en el chat.{" "}
          <Link href="/privacidad" className="underline hover:text-text-primary transition-colors">
            Política de privacidad
          </Link>
        </p>

        <div className="rounded-md bg-white border border-border-default p-3 flex flex-col gap-2">
          <p className="font-heading text-[15px] tracking-[0.06em] uppercase text-text-primary">Acciones rápidas</p>
          <p className="text-[14px] text-text-secondary">Todo listo para seguir avanzando.</p>
          <div className="flex flex-wrap gap-2">
            {["Ver ofertas", "Rastrear pedido", "Ayuda con devolución"].map((q) => (
              <button key={q} onClick={() => void irChat(q)} disabled={creando} className="wf-chip px-3 py-1.5 text-[12px] font-semibold text-text-primary hover:border-accent-signal disabled:opacity-60">{q}</button>
            ))}
          </div>
        </div>
        <p className="text-[12px] text-text-secondary">Toca + para agregar. Si el producto tiene opciones, elige talla y color.</p>
      </div>

      {(creando || fallido !== null) && (
        <div className="px-3 pt-2">
          {creando ? (
            <p role="status" className="rounded-md bg-white border border-border-default p-3 text-[13px] text-text-secondary">
              Creando conversación…
            </p>
          ) : (
            <div role="alert" className="rounded-md bg-error-background border border-error-default p-3 flex items-center justify-between gap-2">
              <p className="text-[13px] text-text-primary">No pudimos crear la conversación. Inténtalo de nuevo.</p>
              <button onClick={() => void irChat(fallido ?? "")}
                className="wf-btn shrink-0 px-3 py-2 text-[12px] font-bold bg-white border border-border-default">REINTENTAR</button>
            </div>
          )}
        </div>
      )}

      <div className="flex shrink-0 items-center gap-2 border-t border-border-default bg-surface-cloud px-3 py-3">
        <button aria-label="Agregar imagen (próximamente)" title="Próximamente" disabled
          className="w-10 h-10 wf-btn flex items-center justify-center bg-surface-ink-soft text-text-inverse border border-border-inverse disabled:opacity-45 disabled:cursor-not-allowed"><PhotoIcon size={20} /></button>
        <input value={composer} maxLength={mensajeMaxCaracteres} disabled={creando} aria-label="Mensaje"
          onChange={(e) => setComposer(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") void irChat(composer); }}
          placeholder="Pregunta por zapatillas, tallas, pedidos…"
          className="flex-1 wf-chip px-4 py-2.5 text-sm outline-none min-w-0 bg-white text-text-primary placeholder:text-text-secondary disabled:opacity-60" />
        <button aria-label="Enviar" disabled={creando || !composer.trim()} onClick={() => void irChat(composer)}
          className="w-10 h-10 wf-btn flex items-center justify-center bg-surface-ink-soft text-text-inverse border border-border-inverse disabled:opacity-45 disabled:cursor-not-allowed"><ArrowUpIcon size={20} /></button>
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
            if (item) void agregarItem({ item, sel });
          }}
          consultarDisponibilidad={(sku) =>
            consultarDisponibilidadUseCase(container.catalogo, { sku }).then((r) =>
              toAvailabilityState(r.status)
            )
          }
        />
      )}
    </div>
  );
}
