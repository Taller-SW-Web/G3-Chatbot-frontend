// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProductCard } from "@/adapters/inbound/components/ProductCard";
import { ProductDetailModal } from "@/adapters/inbound/components/blocks/DetalleProducto";
import { MessageBubble } from "@/adapters/inbound/components/MessageBubble";
import { findVariantSku, mapCarouselItem, mapProductDetail } from "@/domain/entities/CatalogoUI";
import { detalleDeBloque, productosDeCarrusel } from "@/domain/utils/bloquesChat";
import type { Bloque, BloqueCarrusel, BloqueDetalle } from "@/domain/entities/Bloque";
import { messiClub } from "../fixtures/messiClub";

afterEach(cleanup);

function modal(row = messiClub, consultarDisponibilidad?: (sku: string) => Promise<"DISPONIBLE" | "INDETERMINADO">) {
  const onAdd = vi.fn();
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <ProductDetailModal p={mapProductDetail(row)} onClose={vi.fn()} onAdd={onAdd} consultarDisponibilidad={consultarDisponibilidad} />
  </QueryClientProvider>);
  return onAdd;
}

function bubble(bloques: unknown[], onQuickAction = vi.fn()) {
  render(<MessageBubble rol="bot" texto="El catálogo sigue aquí." bloques={bloques as Bloque[]} onQuickAction={onQuickAction} />);
  return onQuickAction;
}

describe("productos sin variantes con el contrato real de G6", () => {
  it("conserva la oferta, la disponibilidad y el SKU sin crear variantes", () => {
    expect(mapCarouselItem(messiClub, 1)).toMatchObject({ price: 69.52, regularPrice: 79, offerPrice: 69.52, availability: "DISPONIBLE", sku: messiClub.single_sku, hasVariants: false, variants: [] });
    expect(mapProductDetail(messiClub)).toMatchObject({ singleSku: messiClub.single_sku, hasVariants: false, variants: [], tallas: [], colores: [] });
  });

  it("la tarjeta agrega directamente y conserva el acceso separado al detalle", () => {
    const onAdd = vi.fn();
    const onDetalle = vi.fn();
    render(<ProductCard producto={mapCarouselItem(messiClub, 1)} onDetalle={onDetalle} onAdd={onAdd} />);
    expect(screen.getByText("S/ 69.52")).toBeTruthy();
    expect(screen.getByText("Disponible")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Agregar adidas Messi Club" }));
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ sku: messiClub.single_sku, product_id: messiClub.product_id }));
    expect(onDetalle).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("btn-detalle"));
    expect(onDetalle).toHaveBeenCalledOnce();
    expect(screen.queryByText(/Elige talla y color/)).toBeNull();
  });

  it.each(["ofertas", "recomendacion", "cross_sell"])("el carrusel %s envía sku y product_id reales", (variant) => {
    const onAction = bubble([{ tipo: "CARRUSEL_PRODUCTOS", datos: { variant, productos: [messiClub] } }]);
    fireEvent.click(screen.getByRole("button", { name: "Agregar adidas Messi Club" }));
    expect(onAction).toHaveBeenCalledWith({ id: "AGREGAR_AL_CARRITO", etiqueta: "Agregar", payload: { sku: messiClub.single_sku, product_id: messiClub.product_id } });
  });

  it("el modal agrega sin selectores ni consultas de una variante inventada", () => {
    const onAdd = modal();
    expect(screen.queryByRole("group", { name: "Talla" })).toBeNull();
    expect(screen.queryByRole("group", { name: "Color" })).toBeNull();
    expect(screen.queryByText(/Elige talla y color/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "AGREGAR AL CARRITO" }));
    expect(onAdd).toHaveBeenCalledWith({ sku: messiClub.single_sku, talla: null, color: null });
  });

  it("el modal consulta solo el SKU real y espera una confirmación antes de agregar", async () => {
    let resolver!: (state: "DISPONIBLE") => void;
    const consultar = vi.fn(() => new Promise<"DISPONIBLE">((resolve) => { resolver = resolve; }));
    const onAdd = modal(messiClub, consultar);
    const button = screen.getByRole("button", { name: "AGREGAR AL CARRITO" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(consultar).toHaveBeenCalledWith(messiClub.single_sku);
    resolver("DISPONIBLE");
    await waitFor(() => expect(button.disabled).toBe(false));
    fireEvent.click(button);
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ sku: messiClub.single_sku }));
  });

  it.each([null, "AGOTADO"])("el modal no agrega sin precio o con agotado: %s", (value) => {
    const row = value === null ? { ...messiClub, price: null } : { ...messiClub, availability: value };
    const onAdd = modal(row as never);
    const button = screen.getByRole("button", { name: "AGREGAR AL CARRITO" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(onAdd).not.toHaveBeenCalled();
  });

  it.each(["failed", "invalid", "AGOTADO"])("no permite agregar si la consulta puntual queda %s", async (state) => {
    const consultar = state === "failed" ? vi.fn().mockRejectedValue(new Error("timeout")) : vi.fn().mockResolvedValue(state === "invalid" ? "DESCONOCIDO" : "AGOTADO");
    const onAdd = modal(messiClub, consultar);
    await screen.findByText(state === "failed" ? "No pudimos consultar la disponibilidad ahora." : state === "invalid" ? "Disponibilidad no confirmada" : "Agotado");
    expect((screen.getByRole("button", { name: "AGREGAR AL CARRITO" }) as HTMLButtonElement).disabled).toBe(true);
    expect(onAdd).not.toHaveBeenCalled();
  });

  it.each([false, true])("permite el INDETERMINADO válido en el modal, con consulta puntual: %s", async (consulta) => {
    const onAdd = modal({ ...messiClub, availability: "INDETERMINADO" }, consulta ? vi.fn().mockResolvedValue("INDETERMINADO") : undefined);
    const button = screen.getByRole("button", { name: "AGREGAR AL CARRITO" }) as HTMLButtonElement;
    await waitFor(() => expect(button.disabled).toBe(false));
    expect(screen.getByText("Disponibilidad no confirmada")).toBeTruthy();
    expect(screen.getByText("No pudimos confirmar el stock en este momento; lo verificaremos antes del pago")).toBeTruthy();
    expect(screen.queryByTestId("badge-disponible")).toBeNull();
    fireEvent.click(button);
    expect(onAdd).toHaveBeenCalledWith({ sku: messiClub.single_sku, talla: null, color: null });
  });

  it("permite agregar cuando solo la consulta puntual responde INDETERMINADO válido", async () => {
    const onAdd = modal(messiClub, vi.fn().mockResolvedValue("INDETERMINADO"));
    const button = screen.getByRole("button", { name: "AGREGAR AL CARRITO" }) as HTMLButtonElement;
    await waitFor(() => expect(button.disabled).toBe(false));
    expect(screen.getByText("No pudimos confirmar el stock en este momento; lo verificaremos antes del pago")).toBeTruthy();
    expect(screen.queryByTestId("badge-disponible")).toBeNull();
    fireEvent.click(button);
    expect(onAdd).toHaveBeenCalledOnce();
  });

  it("el carrusel permite pedir variantes con INDETERMINADO válido", () => {
    const onAction = bubble([{ tipo: "CARRUSEL_PRODUCTOS", datos: { productos: [{ ...messiClub, availability: "INDETERMINADO", has_variants: true, single_sku: null, variants: [{ sku: "REAL-42", talla: "42" }] }] } }]);
    fireEvent.click(screen.getByRole("button", { name: "Agregar adidas Messi Club" }));
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ payload: { product_id: messiClub.product_id } }));
    expect(screen.queryByTestId("badge-disponible")).toBeNull();
  });

  it("la tarjeta permite abrir el selector con INDETERMINADO válido", () => {
    const onDetalle = vi.fn();
    render(<ProductCard producto={mapCarouselItem({ ...messiClub, availability: "INDETERMINADO", has_variants: true, single_sku: null, variants: [{ sku: "REAL-42", talla: "42" }] }, 1)} onDetalle={onDetalle} />);
    fireEvent.click(screen.getByRole("button", { name: "Elegir talla y color de adidas Messi Club" }));
    expect(onDetalle).toHaveBeenCalledOnce();
    expect(screen.queryByTestId("badge-disponible")).toBeNull();
  });
});

describe("datos no obtenidos y payloads inválidos", () => {
  it("distingue el INDETERMINADO válido del dato no obtenido", () => {
    const onAdd = vi.fn();
    const { unmount } = render(<ProductCard producto={mapCarouselItem({ ...messiClub, availability: "INDETERMINADO" }, 1)} onDetalle={vi.fn()} onAdd={onAdd} />);
    expect(screen.getByText("Disponibilidad no confirmada")).toBeTruthy();
    fireEvent.click(screen.getByTestId("btn-agregar"));
    expect(onAdd).toHaveBeenCalledOnce();
    unmount();
    render(<ProductCard producto={mapCarouselItem({ ...messiClub, missing_data: ["availability"] }, 1)} onDetalle={vi.fn()} onAdd={vi.fn()} />);
    expect(screen.getByText("No pudimos consultar la disponibilidad ahora.")).toBeTruthy();
    expect(screen.queryByTestId("badge-disponible")).toBeNull();
    expect((screen.getByTestId("btn-agregar") as HTMLButtonElement).disabled).toBe(true);
  });

  it.each(["price", "availability"])("el detalle SSE y el modal conservan missing_data %s", (field) => {
    const row = { ...messiClub, missing_data: [field] };
    const expected = field === "price" ? "Precio no disponible" : "No pudimos consultar la disponibilidad ahora.";
    bubble([{ tipo: "DETALLE_PRODUCTO", datos: { producto: row } }]);
    expect(screen.getByText(expected)).toBeTruthy();
    cleanup();
    modal(row);
    expect(screen.getByText(expected)).toBeTruthy();
    expect((screen.getByRole("button", { name: "AGREGAR AL CARRITO" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByText("S/ 0.00")).toBeNull();
  });

  it("avisa de resultados parciales y promociones no consultadas sin confundirlos con vacíos", () => {
    bubble([{ tipo: "CARRUSEL_PRODUCTOS", datos: { partial: true, productos: [] } }, { tipo: "LISTA_PROMOCIONES", datos: { unavailable: true, promociones: [] } }]);
    expect(screen.getByText(/Mostramos parte de los resultados/)).toBeTruthy();
    expect(screen.getByText(/No pudimos consultar las promociones ahora/)).toBeTruthy();
    expect(screen.queryByText(/No hay promociones vigentes/)).toBeNull();
    expect(screen.queryByText("No hay productos para mostrar.")).toBeNull();
  });

  it.each([
    { has_variants: true, variants: [] },
    { has_variants: true, variants: [{ talla: "42" }] },
    { has_variants: true, variants: "invalid" },
    { has_variants: true, variants: [null] },
    { has_variants: true, variants: [{ sku: " " }] },
    { single_sku: null },
    { availability: "DESCONOCIDA" },
    { availability: "__proto__" },
    { availability: "constructor" },
    { availability: undefined },
    { has_variants: "false" },
    { missing_data: "availability" },
  ])("se mantiene seguro con %j", (changes) => {
    const row = { ...messiClub, ...changes } as never;
    const onAdd = vi.fn();
    render(<ProductCard producto={mapCarouselItem(row, 1)} onDetalle={vi.fn()} onAdd={onAdd} />);
    expect((screen.getByTestId("btn-agregar") as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByTestId("badge-disponible")).toBeNull();
    cleanup();
    modal(row);
    expect((screen.getByRole("button", { name: "AGREGAR AL CARRITO" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("descarta filas sin identidad y conserva el resto del chat", () => {
    const rows = [null, {}, { ...messiClub, product_id: " " }, messiClub];
    expect(productosDeCarrusel({ datos: { productos: rows } } as BloqueCarrusel)).toHaveLength(1);
    expect(detalleDeBloque({ datos: { producto: {} } } as BloqueDetalle)).toBeNull();
    bubble([null, {}, { tipo: "DETALLE_PRODUCTO", datos: { producto: {} } }, { tipo: "CARRUSEL_PRODUCTOS", datos: { productos: rows } }]);
    expect(screen.getByText("El catálogo sigue aquí.")).toBeTruthy();
    expect(screen.getByText(messiClub.name)).toBeTruthy();
  });

  it("no elige arbitrariamente un SKU entre variantes sin atributos distinguibles", () => {
    const detail = mapProductDetail({ ...messiClub, has_variants: true, variants: [{ sku: "SKU-A" }, { sku: "SKU-B" }] });
    expect(findVariantSku(detail, null, null)).toBeNull();
  });
});
