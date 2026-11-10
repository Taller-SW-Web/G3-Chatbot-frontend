// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { HomePage } from "@/adapters/inbound/pages/HomePage";
import { useChatStore } from "@/application/state/chatStore";
import type { CatalogCardItem, CatalogDetail } from "@/domain/entities/CatalogoUI";

const h = vi.hoisted(() => ({
  buscar: vi.fn(),
  detalle: vi.fn(),
  disponibilidad: vi.fn(),
  agregar: vi.fn(),
  anonimo: vi.fn(),
  crear: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: h.push }) }));
vi.mock("@/infrastructure/di/container", () => ({ container: { api: {}, stream: {} } }));
vi.mock("@/application/use_cases/buscarProductosUseCase", () => ({ buscarProductosUseCase: h.buscar }));
vi.mock("@/application/use_cases/verDetalleProductoUseCase", () => ({ verDetalleProductoUseCase: h.detalle }));
vi.mock("@/application/use_cases/consultarDisponibilidadUseCase", () => ({ consultarDisponibilidadUseCase: h.disponibilidad }));
vi.mock("@/application/use_cases/agregarProductoAlCarritoUseCase", () => ({ agregarProductoAlCarritoUseCase: h.agregar }));
vi.mock("@/application/use_cases/agregarCarritoAnonimoUseCase", () => ({ agregarCarritoAnonimoUseCase: h.anonimo }));
vi.mock("@/application/use_cases/crearConversacionUseCase", () => ({ crearConversacionUseCase: h.crear }));

const producto: CatalogCardItem = {
  product_id: "p1",
  name: "Zapatilla Volta",
  brand: "Inka",
  price: 299,
  image: null,
  shortDescription: "Para asfalto",
  hasVariants: true,
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
  return render(createElement(QueryClientProvider, { client: queryClient }, createElement(HomePage)));
}

function errorCon(code: string, status = 409, extra: Record<string, unknown> = {}) {
  return { response: { status, data: { code, ...extra } } };
}

beforeEach(() => {
  vi.clearAllMocks();
  useChatStore.setState({
    cliente: null,
    ultimaConversacionId: null,
    primerMensaje: null,
    accionPendiente: null,
    authOpen: false,
  });
  h.buscar.mockResolvedValue({ items: [producto], total: 1 });
  h.crear.mockResolvedValue({ conversacionId: "nueva" });
  h.detalle.mockResolvedValue(detalle);
  h.disponibilidad.mockResolvedValue("DISPONIBLE");
  h.agregar.mockResolvedValue({ ok: true });
  h.anonimo.mockResolvedValue(undefined);
});

afterEach(cleanup);

describe("HomePage", () => {
  it("muestra el catálogo de ofertas", async () => {
    montar();

    expect(screen.getByText("Cargando productos…")).toBeDefined();
    expect(await screen.findByText("Zapatilla Volta")).toBeDefined();
    expect(screen.getByText("S/ 299.00")).toBeDefined();
    expect(h.buscar).toHaveBeenCalledWith({}, { pagina: 1, tamanio: 10, soloOfertas: true });
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
    expect(h.agregar).toHaveBeenCalledWith({}, {
      sku: "SKU-42-NEGRO",
      cantidad: 1,
      product_id: "p1",
      talla: "42",
      color: "negro",
      conversacionId: undefined,
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("en anónimo crea la conversación y la guarda al agregar", async () => {
    h.anonimo.mockResolvedValue("conv-anonima");
    montar();

    fireEvent.click(await screen.findByRole("button", { name: "Elegir talla y color de Zapatilla Volta" }));
    fireEvent.click(await screen.findByRole("button", { name: "AGREGAR AL CARRITO" }));

    await waitFor(() => expect(useChatStore.getState().ultimaConversacionId).toBe("conv-anonima"));
    expect(h.anonimo).toHaveBeenCalledWith(expect.objectContaining({
      conversacionGuardada: undefined,
      conversacionCreada: null,
    }));
    expect(h.push).not.toHaveBeenCalled();
  });

  it("explica qué falta cuando el backend pide variante", async () => {
    h.agregar.mockRejectedValue(errorCon("VARIANTE_REQUERIDA", 409, { faltantes: ["talla", "color"] }));
    useChatStore.setState({ cliente: { id: "u1", correo: "ana@ejemplo.pe" } as never });
    montar();

    fireEvent.click(await screen.findByRole("button", { name: "Elegir talla y color de Zapatilla Volta" }));
    fireEvent.click(await screen.findByRole("button", { name: "AGREGAR AL CARRITO" }));

    expect(await screen.findByText("Elige talla y color antes de agregar.")).toBeDefined();
  });

  it("traduce otros errores del carrito", async () => {
    h.agregar.mockRejectedValue(errorCon("STOCK_INSUFICIENTE"));
    useChatStore.setState({ cliente: { id: "u1", correo: "ana@ejemplo.pe" } as never });
    montar();

    fireEvent.click(await screen.findByRole("button", { name: "Elegir talla y color de Zapatilla Volta" }));
    fireEvent.click(await screen.findByRole("button", { name: "AGREGAR AL CARRITO" }));

    expect(await screen.findByText(/No hay stock suficiente/)).toBeDefined();
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

  it("crea la conversación desde el compositor y abre el chat", async () => {
    montar();

    const campo = screen.getByLabelText("Mensaje") as HTMLInputElement;
    fireEvent.change(campo, { target: { value: "  Quiero zapatillas  " } });
    fireEvent.click(screen.getByLabelText("Enviar"));

    await waitFor(() => expect(h.push).toHaveBeenCalledWith("/chat/nueva"));
    expect(h.crear).toHaveBeenCalledTimes(1);
    expect(useChatStore.getState().primerMensaje).toBe("Quiero zapatillas");
    expect(campo.value).toBe("");
  });

  it("envía con Enter y respeta el estado de creación", async () => {
    let resolver!: (v: { conversacionId: string }) => void;
    h.crear.mockReturnValue(new Promise((r) => { resolver = r; }));
    montar();

    const campo = screen.getByLabelText("Mensaje");
    fireEvent.change(campo, { target: { value: "Hola" } });
    fireEvent.keyDown(campo, { key: "Enter" });

    expect(screen.getByText("Creando conversación…")).toBeDefined();
    expect((campo as HTMLInputElement).disabled).toBe(true);
    await waitFor(() => expect(h.crear).toHaveBeenCalledTimes(1));

    resolver({ conversacionId: "nueva" });
    await waitFor(() => expect(h.push).toHaveBeenCalledWith("/chat/nueva"));
  });

  it("no envía un texto vacío", () => {
    montar();
    expect((screen.getByLabelText("Enviar") as HTMLButtonElement).disabled).toBe(true);
  });

  it("permite reintentar la creación de la conversación", async () => {
    h.crear.mockRejectedValueOnce(new Error("caído"));
    montar();

    fireEvent.change(screen.getByLabelText("Mensaje"), { target: { value: "Hola" } });
    fireEvent.click(screen.getByLabelText("Enviar"));

    expect(await screen.findByRole("alert")).toBeDefined();
    fireEvent.click(screen.getByText("REINTENTAR"));

    await waitFor(() => expect(h.push).toHaveBeenCalledWith("/chat/nueva"));
    expect(h.crear).toHaveBeenCalledTimes(2);
  });

  it("abre el chat de ofertas desde el banner y las acciones rápidas", async () => {
    montar();

    fireEvent.click(screen.getByLabelText("Ver ofertas Inka Athletics"));
    await waitFor(() => expect(h.crear).toHaveBeenCalledTimes(1));
    expect(useChatStore.getState().primerMensaje).toBe("Ver ofertas");

    fireEvent.click(screen.getByText("Rastrear pedido"));
    await waitFor(() => expect(h.crear).toHaveBeenCalledTimes(2));
    expect(useChatStore.getState().primerMensaje).toBe("Rastrear pedido");
  });

  it("cambia el banner activo", () => {
    montar();
    expect(screen.getByText("1 / 4")).toBeDefined();
    fireEvent.click(screen.getByLabelText("Banner 3"));
    expect(screen.getByText("3 / 4")).toBeDefined();
  });
});
