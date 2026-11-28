// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { HomePage, type HomeAgregarResultado } from "@/modules/mod-catalog/ui/HomePage";
import { useChatStore } from "@/shared/auth/chatStore";
import type { CatalogCardItem, CatalogDetail } from "@/modules/mod-catalog/domain/entities/CatalogoUI";
import { mapCarouselItem, mapProductDetail } from "@/modules/mod-catalog/domain/entities/CatalogoUI";
import { messiClub } from "@/shared/testing/fixtures/messiClub";

const h = vi.hoisted(() => ({
  buscar: vi.fn(),
  detalle: vi.fn(),
  disponibilidad: vi.fn(),
  agregar: vi.fn(),
  abrirChat: vi.fn(),
  promociones: vi.fn(),
}));

vi.mock("@/modules/mod-catalog/application/buscarProductosUseCase", () => ({ buscarProductosUseCase: h.buscar }));
vi.mock("@/modules/mod-catalog/application/verDetalleProductoUseCase", () => ({ verDetalleProductoUseCase: h.detalle }));
vi.mock("@/modules/mod-catalog/application/consultarDisponibilidadUseCase", () => ({ consultarDisponibilidadUseCase: h.disponibilidad }));
vi.mock("@/modules/mod-catalog/application/listarPromocionesUseCase", () => ({ listarPromocionesUseCase: h.promociones }));

const PROMOS = ["Cyber 10%", "Running week", "Fútbol 2x1"].map((name, i) => ({
  promotion_id: `promo-${i + 1}`,
  name,
  valid_from: "2026-11-01T05:00:00Z",
  valid_until: i === 0 ? "2026-12-01T04:59:00Z" : null,
}));

/** Acciones cableadas por `app/page.tsx` (catálogo + carrito + chat). */
vi.mock("@/shared/di/container", () => ({ container: { catalogo: {} } }));

const producto: CatalogCardItem = {
  product_id: "p1",
  name: "Zapatilla Volta",
  brand: "Inka",
  price: 299,
  image: null,
  shortDescription: "Para asfalto",
  hasVariants: true,
  variants: [{ sku: "SKU-42-NEGRO", talla: "42", color: "negro" }],
  availability: "DISPONIBLE",
};

const detalle: CatalogDetail = {
  product_id: "p1",
  name: "Zapatilla Volta",
  brand: "Inka",
  price: 299,
  image: null,
  hasVariants: true,
  availability: "DISPONIBLE",
  variants: [{ sku: "SKU-42-NEGRO", talla: "42", color: "negro" }],
  tallas: ["42"],
  colores: ["negro"],
};

function montar() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(HomePage, {
        onAgregar: h.agregar,
        onAbrirChat: h.abrirChat,
        mensajeMaxCaracteres: 1000,
      })
    )
  );
}

async function agregarDesdeModal() {
  const button = await screen.findByRole("button", { name: "AGREGAR AL CARRITO" });
  await waitFor(() => expect((button as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(button);
}

beforeEach(() => {
  vi.clearAllMocks();
  h.promociones.mockResolvedValue(PROMOS);
  useChatStore.setState({
    cliente: null,
    ultimaConversacionId: null,
    primerMensaje: null,
    accionPendiente: null,
    authOpen: false,
  });
  h.buscar.mockResolvedValue({ items: [producto], total: 1 });
  h.detalle.mockResolvedValue(detalle);
  h.disponibilidad.mockResolvedValue({ sku: "SKU-42-NEGRO", status: "DISPONIBLE" });
  h.agregar.mockResolvedValue({ ok: true, mensaje: "Zapatilla Volta se agregó a tu carrito." });
  h.abrirChat.mockResolvedValue(undefined);
});

afterEach(cleanup);

describe("HomePage (catálogo + slots)", () => {
  it("agrega Messi Club desde la tarjeta sin pedir variantes ni abrir el detalle", async () => {
    useChatStore.setState({ cliente: { id: "u1", correo: "ana@ejemplo.pe" } as never });
    h.buscar.mockResolvedValue({ items: [mapCarouselItem(messiClub, 1)], total: 1 });
    montar();
    fireEvent.click(await screen.findByRole("button", { name: "Agregar adidas Messi Club" }));
    await screen.findByText(/se agregó a tu carrito/);
    expect(h.agregar).toHaveBeenCalledWith(expect.objectContaining({
      item: expect.objectContaining({ product_id: messiClub.product_id }),
      sel: { sku: messiClub.single_sku, talla: null, color: null },
    }));
    expect(h.detalle).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("agrega Messi Club desde el modal sin selectores", async () => {
    useChatStore.setState({ cliente: { id: "u1", correo: "ana@ejemplo.pe" } as never });
    h.buscar.mockResolvedValue({ items: [mapCarouselItem(messiClub, 1)], total: 1 });
    h.detalle.mockResolvedValue(mapProductDetail(messiClub));
    h.disponibilidad.mockResolvedValue({ sku: messiClub.single_sku, status: "DISPONIBLE" });
    montar();
    fireEvent.click(await screen.findByTestId("btn-detalle"));
    const add = await screen.findByRole("button", { name: "AGREGAR AL CARRITO" });
    await waitFor(() => expect((add as HTMLButtonElement).disabled).toBe(false));
    expect(screen.queryByRole("group", { name: "Talla" })).toBeNull();
    expect(screen.queryByRole("group", { name: "Color" })).toBeNull();
    fireEvent.click(add);
    await screen.findByText(/se agregó a tu carrito/);
    expect(h.agregar).toHaveBeenCalledWith(expect.objectContaining({
      item: expect.objectContaining({ product_id: messiClub.product_id }),
      sel: { sku: messiClub.single_sku, talla: null, color: null },
    }));
  });

  it("avisa de una lista REST parcial, incluso sin productos", async () => {
    h.buscar.mockResolvedValue({ items: [], total: 0, partial: true });
    montar();
    expect(await screen.findByText(/Mostramos parte de los resultados/)).toBeTruthy();
    expect(screen.queryByText("No hay productos en oferta ahora mismo.")).toBeNull();
  });

  it("muestra el catálogo de ofertas", async () => {
    montar();

    expect(screen.getByText("Cargando productos…")).toBeDefined();
    expect(await screen.findByText("Zapatilla Volta")).toBeDefined();
    expect(screen.getByText("S/ 299.00")).toBeDefined();
    expect(h.buscar).toHaveBeenCalledWith({}, { pagina: 1, tamanio: 10, soloOfertas: true });
  });

  it("conecta el selector de orden con la búsqueda del catálogo", async () => {
    montar();
    await screen.findByText("Zapatilla Volta");

    fireEvent.change(screen.getByLabelText("Ordenar por"), { target: { value: "precio_asc" } });

    await waitFor(() =>
      expect(h.buscar).toHaveBeenCalledWith(
        {},
        { pagina: 1, tamanio: 10, soloOfertas: true, orden: "precio_asc" }
      )
    );
  });

  it("avisa cuando no hay ofertas", async () => {
    h.buscar.mockResolvedValue({ items: [], total: 0 });
    montar();

    expect(await screen.findByText("No hay productos en oferta ahora mismo.")).toBeDefined();
  });

  it("distingue el catálogo caído del error genérico y permite reintentar", async () => {
    h.buscar
      .mockRejectedValueOnce({ response: { status: 503, data: { code: "SERVICIO_NO_DISPONIBLE" } } })
      .mockResolvedValueOnce({ items: [producto], total: 1 });
    montar();

    expect(await screen.findByText(/El catálogo no está disponible ahora/)).toBeDefined();
    fireEvent.click(screen.getByText("Reintentar"));
    expect(await screen.findByText("Zapatilla Volta")).toBeDefined();
  });

  it("usa el mensaje genérico cuando el fallo no es de disponibilidad", async () => {
    h.buscar.mockRejectedValue({ response: { status: 500, data: { code: "ERROR" } } });
    montar();

    expect(await screen.findByText("No pudimos cargar el catálogo.")).toBeDefined();
  });

  it("abre el detalle, consulta disponibilidad y agrega al carrito con sesión", async () => {
    useChatStore.setState({ cliente: { id: "u1", correo: "ana@ejemplo.pe" } as never });
    montar();

    fireEvent.click(await screen.findByRole("button", { name: "Elegir talla y color de Zapatilla Volta" }));
    expect(screen.getByText("Cargando detalle…")).toBeDefined();

    expect(await screen.findByRole("button", { name: "AGREGAR AL CARRITO" })).toBeDefined();
    await waitFor(() => expect(h.disponibilidad).toHaveBeenCalledWith({}, { sku: "SKU-42-NEGRO" }));

    fireEvent.click(screen.getByRole("button", { name: "AGREGAR AL CARRITO" }));

    expect(await screen.findByText(/se agregó a tu carrito/)).toBeDefined();
    expect(h.agregar).toHaveBeenCalledWith({
      item: expect.objectContaining({ product_id: "p1" }),
      sel: { sku: "SKU-42-NEGRO", talla: "42", color: "negro" },
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("muestra el mensaje de error que devuelve el composition root", async () => {
    h.agregar.mockResolvedValue({ ok: false, mensaje: "Elige talla y color antes de agregar." });
    useChatStore.setState({ cliente: { id: "u1", correo: "ana@ejemplo.pe" } as never });
    montar();

    fireEvent.click(await screen.findByRole("button", { name: "Elegir talla y color de Zapatilla Volta" }));
    await agregarDesdeModal();

    expect(await screen.findByText("Elige talla y color antes de agregar.")).toBeDefined();
  });

  it("mantiene abierto el detalle cuando el agregado falla", async () => {
    h.agregar.mockResolvedValue({ ok: false, mensaje: "No hay stock suficiente para esa cantidad. Prueba con menos." });
    useChatStore.setState({ cliente: { id: "u1", correo: "ana@ejemplo.pe" } as never });
    montar();

    fireEvent.click(await screen.findByRole("button", { name: "Elegir talla y color de Zapatilla Volta" }));
    await agregarDesdeModal();

    expect(await screen.findByRole("dialog")).toBeDefined();
    expect(screen.getByText(/No hay stock suficiente/)).toBeDefined();
  });

  it("muestra el error del detalle y permite reintentar", async () => {
    h.detalle
      .mockRejectedValueOnce({ response: { status: 404, data: { code: "PRODUCTO_NO_DISPONIBLE" } } })
      .mockResolvedValueOnce(detalle);
    montar();

    fireEvent.click(await screen.findByRole("button", { name: "Elegir talla y color de Zapatilla Volta" }));
    expect(await screen.findByTestId("detalle-error")).toBeDefined();
    expect(screen.getByText("Producto no disponible.")).toBeDefined();

    fireEvent.click(screen.getByText("Reintentar"));
    expect(await screen.findByRole("button", { name: "AGREGAR AL CARRITO" })).toBeDefined();
  });

  it("trata el detalle caído como problema de conexión", async () => {
    h.detalle.mockRejectedValue(new Error("sin red"));
    montar();

    fireEvent.click(await screen.findByRole("button", { name: "Elegir talla y color de Zapatilla Volta" }));
    expect(await screen.findByText(/No pudimos cargar el detalle\. Revisa tu conexión/)).toBeDefined();
  });

  it("delega la creación de la conversación al route file y limpia el compositor", async () => {
    montar();

    const campo = screen.getByLabelText("Mensaje") as HTMLInputElement;
    fireEvent.change(campo, { target: { value: "  Quiero zapatillas  " } });
    fireEvent.click(screen.getByLabelText("Enviar"));

    await waitFor(() => expect(h.abrirChat).toHaveBeenCalledWith("Quiero zapatillas"));
    expect(campo.value).toBe("");
  });

  it("envía con Enter y respeta el estado de creación", async () => {
    let resolver!: () => void;
    h.abrirChat.mockReturnValue(new Promise<void>((r) => { resolver = r; }));
    montar();

    const campo = screen.getByLabelText("Mensaje");
    fireEvent.change(campo, { target: { value: "Hola" } });
    fireEvent.keyDown(campo, { key: "Enter" });

    expect(screen.getByText("Creando conversación…")).toBeDefined();
    expect((campo as HTMLInputElement).disabled).toBe(true);
    await waitFor(() => expect(h.abrirChat).toHaveBeenCalledTimes(1));

    resolver();
    await waitFor(() => expect((campo as HTMLInputElement).disabled).toBe(false));
  });

  it("no envía un texto vacío", () => {
    montar();
    expect((screen.getByLabelText("Enviar") as HTMLButtonElement).disabled).toBe(true);
  });

  it("permite reintentar la creación de la conversación", async () => {
    h.abrirChat.mockRejectedValueOnce(new Error("caído"));
    montar();

    fireEvent.change(screen.getByLabelText("Mensaje"), { target: { value: "Hola" } });
    fireEvent.click(screen.getByLabelText("Enviar"));

    expect(await screen.findByRole("alert")).toBeDefined();
    fireEvent.click(screen.getByText("REINTENTAR"));

    await waitFor(() => expect(h.abrirChat).toHaveBeenCalledTimes(2));
  });

  it("abre el chat de ofertas desde el banner y las acciones rápidas", async () => {
    montar();

    fireEvent.click(await screen.findByLabelText("Ver ofertas Inka Athletics"));
    await waitFor(() => expect(h.abrirChat).toHaveBeenCalledWith("Ver ofertas"));

    fireEvent.click(screen.getByText("Rastrear pedido"));
    await waitFor(() => expect(h.abrirChat).toHaveBeenCalledWith("Rastrear pedido"));
  });

  it("muestra una slide por promoción real y cada indicador cambia el contenido (frontend#183)", async () => {
    montar();
    expect(await screen.findByText("Cyber 10%")).toBeDefined();
    expect(screen.getByText("1 / 3")).toBeDefined();
    expect(screen.getByText(/Vigente hasta el/)).toBeDefined();
    expect(screen.getAllByRole("button", { name: /^Banner \d/ })).toHaveLength(3);

    fireEvent.click(screen.getByLabelText("Banner 3: Fútbol 2x1"));
    expect(screen.getByTestId("banner-promocion").textContent).toBe("Fútbol 2x1");
    expect(screen.getByText("3 / 3")).toBeDefined();
  });

  it("con una sola promoción no muestra indicadores ni contador", async () => {
    h.promociones.mockResolvedValue(PROMOS.slice(0, 1));
    montar();
    expect(await screen.findByText("Cyber 10%")).toBeDefined();
    expect(screen.queryByText(/\d \/ \d/)).toBeNull();
    expect(screen.queryAllByRole("button", { name: /^Banner \d/ })).toHaveLength(0);
  });

  it("sin promociones o si fallan, el banner no se muestra y no hay error (SPEC-05 · Scenario: Promociones no disponibles)", async () => {
    h.promociones.mockRejectedValue(new Error("503"));
    montar();
    await waitFor(() => expect(h.promociones).toHaveBeenCalled());
    expect(screen.queryByLabelText("Ver ofertas Inka Athletics")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("sobrevive a un resultado de agregado sin mensaje de error", async () => {
    h.agregar.mockResolvedValue({ ok: false, mensaje: "No pudimos completar la acción. Intenta de nuevo." } satisfies HomeAgregarResultado);
    useChatStore.setState({ cliente: { id: "u1", correo: "ana@ejemplo.pe" } as never });
    montar();

    fireEvent.click(await screen.findByRole("button", { name: "Elegir talla y color de Zapatilla Volta" }));
    await agregarDesdeModal();
    expect(await screen.findByText(/No pudimos completar la acción/)).toBeDefined();
  });

  it("no llama al agregado si el producto no admite agregado directo", async () => {
    const agotado: CatalogCardItem = { ...producto, availability: "AGOTADO", sku: "SKU-1" } as CatalogCardItem;
    h.buscar.mockResolvedValue({ items: [agotado], total: 1 });
    montar();
    await screen.findByText("Zapatilla Volta");
    expect(h.agregar).not.toHaveBeenCalled();
  });

  it("muestra esqueleto de carga accesible mientras consulta el catálogo", () => {
    h.buscar.mockImplementation(() => new Promise(() => {}));
    montar();
    expect(screen.getByRole("status")).toBeDefined();
    expect(screen.getByText("Cargando productos…")).toBeDefined();
  });

  it("renderiza el enlace a la política de privacidad de forma navegable", async () => {
    montar();
    const link = await screen.findByRole("link", { name: "Política de privacidad" });
    expect(link.getAttribute("href")).toBe("/privacidad");
  });
});
