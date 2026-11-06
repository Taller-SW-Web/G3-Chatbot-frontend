// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PriceTag } from "@/adapters/inbound/components/PriceTag";
import { ProductCard } from "@/adapters/inbound/components/ProductCard";
import { MessageBubble } from "@/adapters/inbound/components/MessageBubble";
import { AccionesRapidas } from "@/adapters/inbound/components/blocks/AccionesRapidas";
import { BloqueCarrito } from "@/adapters/inbound/components/blocks/BloqueCarrito";
import { ProductDetailModal } from "@/adapters/inbound/components/blocks/DetalleProducto";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { mapCarouselItem, mapProductDetail } from "@/domain/entities/CatalogoUI";
import { formatPromotionDate, parseAmount, parseIsoDate, parsePromotions } from "@/domain/entities/PromocionesUI";
import { mapearHistorial } from "@/adapters/outbound/mapearHistorial";
import type { Bloque } from "@/domain/entities/Bloque";

// Explicit local fixtures: these are not successful G6 responses.
const item = { product_id: "fixture-1", name: "Zapatilla de prueba", price: "239.90", regular_price: "299.90", offer_price: "239.90", savings_pct: 20, availability: "INDETERMINADO", recommendation_reason: "Para correr en asfalto" };
const promotion = { promotion_id: "fixture-promo", name: "Campaña de prueba", valid_from: "2026-11-01T02:00:00Z", valid_until: "2026-12-01T02:00:00Z" };
function bubble(blocks: unknown[], action?: (a: unknown) => void) {
  return render(<MessageBubble texto="" rol="bot" bloques={blocks as Bloque[]} onQuickAction={action} />);
}
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("safe additive offer contract", () => {
  it.each([null, undefined, "", " ", "NaN", Infinity, -1, {}, [], "0x12", "1e3", "USD 12"])("does not coerce %j into a price", (value) => {
    expect(parseAmount(value)).toBeNull();
  });
  it("accepts explicit zero and decimal strings", () => {
    expect(parseAmount("0.00")).toBe(0);
    expect(parseAmount("239.90")).toBe(239.9);
    expect(mapCarouselItem({ product_id: "legacy" }, 1).price).toBeNull();
    expect(mapProductDetail({ product_id: "legacy", variants: [null] } as never).variants).toEqual([]);
  });
  it("validates calendar dates and timezone, and formats in Lima", () => {
    expect(parseIsoDate("2026-02-30T12:00:00Z")).toBeNull();
    expect(parseIsoDate("2026-11-01")).toBeNull();
    expect(parseIsoDate("2026-11-01T12:00:00")).toBeNull();
    expect(formatPromotionDate(promotion.valid_from)).toBe("31/10/2026");
    expect(formatPromotionDate("2027-01-01T02:00:00Z")).toBe("31/12/2026");
    expect(parsePromotions([{ ...promotion, coupon_code: "PRIVATE" }])).toEqual([promotion]);
    expect(parsePromotions([{ ...promotion, valid_until: "unknown" }])).toBeNull();
    expect(parsePromotions([{ ...promotion, valid_until: "2020-01-01T00:00:00Z" }])).toBeNull();
  });
  it("retains only valid public summaries in mixed responses", () => {
    const another = { ...promotion, promotion_id: "second", valid_until: null };
    expect(parsePromotions([
      null, { ...promotion, promotion_id: " " }, { ...promotion, name: 42 },
      { ...promotion, valid_from: "2026-02-30T00:00:00Z" },
      { ...promotion, valid_until: "2026-12-01T00:00:00" },
      { ...promotion, valid_until: "2020-01-01T00:00:00Z" },
      { ...promotion, coupon_code: "PRIVATE", benefits: ["secret"] }, another,
    ])).toEqual([promotion, another]);
  });
  it("distinguishes empty responses from unavailable or entirely malformed responses", () => {
    expect(parsePromotions([])).toEqual([]);
    for (const value of [null, {}, "promotions", [null, {}, { ...promotion, promotion_id: 42 }]]) {
      expect(parsePromotions(value)).toBeNull();
    }
  });
  it("renders effective, regular and server savings without calculating a percentage", () => {
    const { container } = render(<PriceTag {...mapCarouselItem({ ...item, savings_pct: 17 }, 1)} />);
    expect(screen.getByText("S/ 239.90")).toBeTruthy();
    expect(container.querySelector("s")?.textContent).toBe("S/ 299.90");
    expect(screen.getByText("17% de ahorro")).toBeTruthy();
  });
  it("drops offer styling when expiry passes in an open view", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-05T12:00:00Z"));
    const { container } = render(<PriceTag {...mapCarouselItem({ ...item, offer_valid_until: "2026-11-05T12:00:01Z" }, 1)} />);
    expect(container.querySelector("s")).toBeTruthy();
    act(() => { vi.advanceTimersByTime(1001); });
    expect(container.querySelector("s")).toBeNull();
    expect(screen.queryByText(/de ahorro/)).toBeNull();
    expect(screen.getByText("S/ 239.90")).toBeTruthy();
  });
  it.each(["bad", "2020-01-01T00:00:00Z"])("does not decorate an invalid or expired offer %s", (expiry) => {
    const { container } = render(<PriceTag {...mapCarouselItem({ ...item, offer_valid_until: expiry }, 1)} />);
    expect(container.querySelector("s")).toBeNull();
  });
  it("uses unavailable label and disables adding with a missing price", () => {
    render(<ProductCard producto={mapCarouselItem({ ...item, price: null }, 1)} onDetalle={vi.fn()} />);
    expect(screen.getByText("Precio no disponible")).toBeTruthy();
    expect((screen.getByTestId("btn-agregar") as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByText("S/ 0.00")).toBeNull();
  });
  it("disables adding in a detail modal even when its SKU is known", () => {
    render(<QueryClientProvider client={new QueryClient()}><ProductDetailModal p={mapProductDetail({ ...item, price: null, single_sku: "fixture-sku" })} onClose={vi.fn()} onAdd={vi.fn()} /></QueryClientProvider>);
    expect((screen.getByRole("button", { name: "AGREGAR AL CARRITO" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("Precio no disponible")).toBeTruthy();
  });
  it("shows authoritative cart discounts and the server expiry notice", () => {
    render(<BloqueCarrito datos={{ lineas: [], subtotal: 299.9, total: 275, descuentos: [{ nombre: "", monto: 24.9 }], avisos: ["La oferta de X terminó; el precio ahora es S/ 299.90"] }} onVerCarrito={vi.fn()} onPagar={vi.fn()} />);
    expect(screen.getByText("Descuento")).toBeTruthy();
    expect(screen.getByText("S/ 24.90")).toBeTruthy();
    expect(screen.getByText("S/ 275.00")).toBeTruthy();
    expect(screen.getByText(/La oferta de X terminó/)).toBeTruthy();
  });
  it("renders public promotion summaries, empty and malformed states", () => {
    const { unmount, container } = bubble([{ tipo: "LISTA_PROMOCIONES", datos: { promociones: [null, { ...promotion, coupon_code: "PRIVATE", name: "<script>alert(1)</script>Campaña de prueba" }] } }]);
    expect(screen.getByText("Campaña de prueba")).toBeTruthy();
    expect(screen.getByText("Desde el 31/10/2026 hasta el 30/11/2026")).toBeTruthy();
    expect(screen.queryByText("PRIVATE")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
    unmount();
    const empty = bubble([{ tipo: "LISTA_PROMOCIONES", datos: { promociones: [] } }]);
    expect(screen.getByText(/No hay promociones vigentes/)).toBeTruthy();
    empty.unmount();
    bubble([{ tipo: "LISTA_PROMOCIONES", datos: { promociones: [null] } }]);
    expect(screen.getByText(/No pudimos mostrar/)).toBeTruthy();
  });
});

describe("recommendation and cross-sell presentation", () => {
  it("renders reasons and at most three cross-sell items without a local silence policy", () => {
    const action = vi.fn();
    bubble([{ tipo: "CARRUSEL_PRODUCTOS", datos: { variant: "cross_sell", titulo: "Completa tu equipo", productos: [1, 2, 3, 4].map((n) => ({ ...item, product_id: `fixture-${n}`, name: `Complemento ${n}` })) } }, { tipo: "ACCIONES_RAPIDAS", acciones: [{ id: "SILENCIAR_COMPLEMENTOS", etiqueta: "No gracias", payload: {} }] }], action);
    expect(screen.getAllByText(item.recommendation_reason)).toHaveLength(3);
    expect(screen.queryByText("Complemento 4")).toBeNull();
    expect(screen.queryByText("Ver más productos")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "No gracias" }));
    expect(action).toHaveBeenCalledWith({ id: "SILENCIAR_COMPLEMENTOS", etiqueta: "No gracias", payload: {} });
  });
  it("preserves accumulated clarification payload and handles repeated action ids", () => {
    const action = vi.fn();
    bubble([{ tipo: "ACCIONES_RAPIDAS", pregunta: "¿Dónde corres?", acciones: [null, { id: "RECOMENDAR_PRODUCTOS", etiqueta: "Asfalto", payload: { actividad: "running", nivel: "principiante", superficie: "asfalto" } }, { id: "RECOMENDAR_PRODUCTOS", etiqueta: "Tierra", payload: { actividad: "running", superficie: "tierra" } }] }], action);
    fireEvent.click(screen.getByRole("button", { name: "Asfalto" }));
    expect(action).toHaveBeenCalledWith(expect.objectContaining({ id: "RECOMENDAR_PRODUCTOS", payload: { actividad: "running", nivel: "principiante", superficie: "asfalto" } }));
    expect(screen.getByRole("button", { name: "Tierra" })).toBeTruthy();
  });
  it("disables all actions while a request is pending and ignores duplicate clicks", async () => {
    let finish!: () => void;
    const pending = new Promise<void>((resolve) => { finish = resolve; });
    const action = vi.fn(() => pending);
    render(<AccionesRapidas acciones={[{ id: "SILENCIAR_COMPLEMENTOS", etiqueta: "No gracias" }]} onAccion={action} />);
    const button = screen.getByRole("button", { name: "No gracias" }) as HTMLButtonElement;
    fireEvent.click(button); fireEvent.click(button);
    expect(action).toHaveBeenCalledTimes(1);
    expect(button.disabled).toBe(true);
    await act(async () => { finish(); await pending; });
    expect(button.disabled).toBe(false);
  });
  it("preserves legacy carousels and ignores malformed optional text", () => {
    bubble([{ tipo: "CARRUSEL_PRODUCTOS", datos: { titulo: {}, productos: [null, { ...item, name: {}, recommendation_reason: {}, regular_price: null }] } }], vi.fn());
    expect(screen.getByText(item.product_id)).toBeTruthy();
    expect(screen.getByText("S/ 239.90")).toBeTruthy();
  });
});

// Permanent independent-review reproductions (Q1/S1 plus preserved behavior).
it.each([null, {nombre: 42, monto: 24.9}, {nombre: {}, monto: 24.9}])('malformed discount %j must not crash cart', discount => {
  expect(() => render(<BloqueCarrito datos={{lineas: [], subtotal: 299.9, total:275, descuentos:[discount]} as never} onVerCarrito={()=>{}} onPagar={()=>{}} />)).not.toThrow();
});
it('nonarray discounts must degrade without crashing cart', () => {
  expect(() => render(<BloqueCarrito datos={{lineas: [], subtotal:299.9, descuentos:{}} as never} onVerCarrito={()=>{}} onPagar={()=>{}} />)).not.toThrow();
});
it.each(['array', 'wrapper'])('persisted %s keeps five reasons and exact repeated-ID payload', async shape => {
  const blocks = [
    {tipo:'CARRUSEL_PRODUCTOS', datos:{variant:'recomendacion', productos:Array.from({length:7},(_,i)=>({product_id:`p${i}`, name:`Producto ${i}`, price:'10.00', recommendation_reason:`Razon ${i}`, availability:'INDETERMINADO'}))}},
    {tipo:'ACCIONES_RAPIDAS', acciones:[{id:'RECOMENDAR_PRODUCTOS', etiqueta:'Asfalto',payload:{actividad:'running',edad:10,omitirPreguntas:false,superficie:'asfalto'}},{id:'RECOMENDAR_PRODUCTOS',etiqueta:'Tierra',payload:{actividad:'running',superficie:'tierra'}}]},
  ];
  const [message] = mapearHistorial([{id:'m',conversacionId:'c',rol:'bot',texto:'',creadoEn:'2026-11-05T00:00:00Z',bloques:shape==='array'?blocks:{blocks}}]);
  const callback = vi.fn();
  render(<MessageBubble texto='' rol='bot' bloques={message.bloques} onQuickAction={callback}/>);
  expect(screen.getAllByText(/^Razon/)).toHaveLength(5);
  expect(screen.queryByText('Producto 5')).toBeNull();
  await act(async()=>fireEvent.click(screen.getByRole('button',{name:'Asfalto'})));
  expect(callback).toHaveBeenCalledWith({id:'RECOMENDAR_PRODUCTOS',etiqueta:'Asfalto',payload:{actividad:'running',edad:10,omitirPreguntas:false,superficie:'asfalto'}});
});
it('price expiry update from dated to null still accepts backend current offer', () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-05T00:00:00Z'));
  const row = {product_id:'p',price:'80',regular_price:'100',offer_price:'80',savings_pct:20};
  const {rerender, container} = render(<PriceTag {...mapCarouselItem({...row,offer_valid_until:'2026-11-05T00:00:01Z'},1)}/>);
  act(()=>vi.advanceTimersByTime(1001)); expect(container.querySelector('s')).toBeNull();
  rerender(<PriceTag {...mapCarouselItem({...row,offer_valid_until:null},1)}/>);
  expect(container.querySelector('s')?.textContent).toBe('S/ 100.00');
});
it('chat cart exposes original subtotal alongside basket discount and result', () => {
  render(<BloqueCarrito datos={{lineas:Array.from({length:4},(_,i)=>({item_id:`line${i}`,nombre:`Producto ${i}`,cantidad:1,precio:100,disponible:true})),subtotal:400,descuentos:[{nombre:'Campana',monto:50}],total:350}} onVerCarrito={()=>{}} onPagar={()=>{}} />);
  expect(screen.getByText('S/ 400.00')).toBeTruthy();
  expect(screen.getByText('S/ 50.00')).toBeTruthy();
  expect(screen.getByText('S/ 350.00')).toBeTruthy();
});

it.each([{}, null, [null], [[]], [{ nombre: "Campaign", monto: null }], [{ monto: -1 }], [{ monto: "bad" }]])('malformed chat discounts %j remain unavailable rather than empty or zero', discounts => {
  render(<BloqueCarrito datos={{ lineas: [], subtotal: 299.9, total: 275, descuentos: discounts } as never} onVerCarrito={() => {}} onPagar={() => {}} />);
  expect(screen.getByText("No pudimos mostrar todos los descuentos.")).toBeTruthy();
  expect(screen.queryByText("S/ 0.00")).toBeNull();
});

it('keeps valid mixed discount rows, safely falls back names and preserves explicit zero', () => {
  render(<BloqueCarrito datos={{ lineas: [], subtotal: 299.9, total: 275, descuentos: [null, { nombre: {}, monto: "24.90" }, { monto: 0 }] } as never} onVerCarrito={() => {}} onPagar={() => {}} />);
  expect(screen.getAllByText("Descuento")).toHaveLength(2);
  expect(screen.getByText("S/ 24.90")).toBeTruthy();
  expect(screen.getByText("S/ 0.00")).toBeTruthy();
  expect(screen.getByText("No pudimos mostrar todos los descuentos.")).toBeTruthy();
});

it('keeps absent or empty legacy discounts distinct from unavailable', () => {
  const { rerender } = render(<BloqueCarrito datos={{ lineas: [], subtotal: 400 }} onVerCarrito={() => {}} onPagar={() => {}} />);
  expect(screen.queryByText("No pudimos mostrar todos los descuentos.")).toBeNull();
  rerender(<BloqueCarrito datos={{ lineas: [], subtotal: 400, descuentos: [] }} onVerCarrito={() => {}} onPagar={() => {}} />);
  expect(screen.queryByText("No pudimos mostrar todos los descuentos.")).toBeNull();
});

it('distinguishes temporarily busy chips from unavailable actions', () => {
  const actions = [{ id: "RECOMENDAR_PRODUCTOS", etiqueta: "Asfalto" }];
  const { rerender } = render(<AccionesRapidas acciones={actions} busy />);
  expect(screen.getByRole("group").getAttribute("aria-busy")).toBe("true");
  expect(screen.queryByText(/Las acciones no están disponibles/)).toBeNull();
  rerender(<AccionesRapidas acciones={actions} />);
  expect(screen.getByRole("group").getAttribute("aria-busy")).toBe("false");
  expect(screen.getByText(/Las acciones no están disponibles/)).toBeTruthy();
});
