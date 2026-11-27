// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DevolucionPage } from "@/modules/mod-postventa/ui/DevolucionPage";
import { useChatStore } from "@/shared/auth/chatStore";

const push = vi.hoisted(() => vi.fn());
const params = vi.hoisted(() => ({ value: new URLSearchParams() }));
const obtenerPedido = vi.hoisted(() => vi.fn());
const crearDevolucion = vi.hoisted(() => vi.fn());
const subirEvidencia = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => params.value,
}));

vi.mock("@/modules/mod-orders/public", () => ({
  pedidosPort: { obtenerPedido },
}));

vi.mock("@/shared/di/container", () => ({
  container: {
    postventa: { crearDevolucion, subirEvidencia },
  },
}));

const pedidoEntregado = {
  pedidoId: "PED-2026-00002",
  canal: "CHATBOT",
  estado: "ENTREGADO",
  estadoEtiqueta: "Entregado",
  total: 299.9,
  moneda: "PEN",
  fechaCreacion: "2026-11-02T10:00:00Z",
  items: [
    {
      productoId: "P-100",
      sku: "SKU-100",
      descripcion: "Zapatilla",
      cantidad: 1,
      precioUnitario: 299.9,
    },
  ],
  envio: null,
  historial: [],
};

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <DevolucionPage />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  params.value = new URLSearchParams();
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn(() => "blob:evidencia"),
  });
  obtenerPedido.mockResolvedValue(pedidoEntregado);
  crearDevolucion.mockResolvedValue({
    devolucionId: "DEV-2026-00099",
    pedidoId: "PED-2026-00002",
    tipo: "CAMBIO",
    estado: "SOLICITADA",
    motivo: "TALLA_INCORRECTA",
    fechaRegistro: "2026-11-20T10:00:00Z",
    items: [],
    evidencias: [],
    historial: [],
    recepciones: [],
  });
  subirEvidencia.mockResolvedValue({
    tipo: "IMAGEN",
    url: "https://example.test/evidencia.jpg",
    nombreArchivoOriginal: "evidencia.jpg",
    tamanioBytes: 10,
    fechaSubida: "2026-11-20T10:00:00Z",
  });
  useChatStore.setState({ ultimaConversacionId: null });
});

afterEach(cleanup);

describe("DevolucionPage", () => {
  it("pide elegir un pedido cuando no hay pedidoId", () => {
    renderPage();

    expect(screen.getByText("Solicitar cambio o devolución")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "IR A MIS PEDIDOS" }));
    expect(push).toHaveBeenCalledWith("/pedidos");
  });

  it("muestra carga mientras consulta el pedido", () => {
    params.value = new URLSearchParams("pedidoId=PED-2026-00002");
    obtenerPedido.mockReturnValue(new Promise(() => {}));
    renderPage();

    expect(screen.getByText(/Cargando pedido/)).toBeDefined();
  });

  it("muestra error si el pedido no existe o no pertenece al cliente", async () => {
    params.value = new URLSearchParams("pedidoId=PED-2026-404");
    obtenerPedido.mockRejectedValue({ response: { status: 404, data: { code: "RECURSO_NO_ENCONTRADO" } } });
    renderPage();

    expect(await screen.findByText("No encontré ese pedido")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "VOLVER A MIS PEDIDOS" }));
    expect(push).toHaveBeenCalledWith("/pedidos");
  });

  it("bloquea la devolución si el pedido no está entregado", async () => {
    params.value = new URLSearchParams("pedidoId=PED-2026-00003");
    obtenerPedido.mockResolvedValue({ ...pedidoEntregado, estado: "EN_PREPARACION" });
    renderPage();

    expect(await screen.findByText("Pedido no entregado")).toBeDefined();
  });

  it("crea la devolución y muestra el código de seguimiento", async () => {
    params.value = new URLSearchParams("pedidoId=PED-2026-00002");
    renderPage();

    await screen.findByText(/Solicitar devolución/);
    fireEvent.click(screen.getByRole("button", { name: /ENVIAR SOLICITUD/ }));

    await waitFor(() => expect(crearDevolucion).toHaveBeenCalledWith(expect.objectContaining({
      pedidoId: "PED-2026-00002",
      tipo: "CAMBIO",
      motivo: "TALLA_INCORRECTA",
      items: [{ productoId: "P-100", cantidad: 1 }],
    })));
    expect(await screen.findByText(/SOLICITUD ENVIADA/)).toBeDefined();
    expect(screen.getByText(/DEV-2026-00099/)).toBeDefined();
    expect(screen.getByText(/Sin evidencia adjunta/)).toBeDefined();
    expect(screen.queryByText(/La evidencia quedó adjunta/)).toBeNull();
  });

  it("confirma la evidencia solo cuando G5 la devuelve registrada", async () => {
    params.value = new URLSearchParams("pedidoId=PED-2026-00002");
    crearDevolucion.mockResolvedValueOnce({
      devolucionId: "DEV-2026-00100",
      pedidoId: "PED-2026-00002",
      tipo: "CAMBIO",
      estado: "SOLICITADA",
      motivo: "PRODUCTO_DEFECTUOSO_O_INCORRECTO",
      fechaRegistro: "2026-11-20T10:00:00Z",
      items: [],
      evidencias: [{ tipo: "IMAGEN", url: "https://example.test/evidencia.jpg" }],
      historial: [],
      recepciones: [],
    });
    renderPage();

    await screen.findByText(/Solicitar devolución/);
    fireEvent.click(screen.getByRole("button", { name: /ENVIAR SOLICITUD/ }));

    expect(await screen.findByText(/SOLICITUD ENVIADA/)).toBeDefined();
    expect(screen.getByText(/La evidencia quedó adjunta/)).toBeDefined();
    expect(screen.queryByText(/Sin evidencia adjunta/)).toBeNull();
  });

  it("muestra la devolución duplicada y permite registrarla igual con forzar", async () => {
    params.value = new URLSearchParams("pedidoId=PED-2026-00002");
    crearDevolucion.mockRejectedValueOnce({
      response: {
        status: 409,
        data: { code: "DEVOLUCION_DUPLICADA", devolucionId: "DEV-2026-00001" },
      },
    });
    renderPage();

    await screen.findByText(/Solicitar devolución/);
    fireEvent.click(screen.getByRole("button", { name: /ENVIAR SOLICITUD/ }));

    expect(await screen.findByTestId("postventa-duplicado")).toBeDefined();
    expect(screen.getByText(/DEV-2026-00001/)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "REGISTRAR IGUAL" }));
    await waitFor(() =>
      expect(crearDevolucion).toHaveBeenLastCalledWith(expect.objectContaining({ forzar: true }))
    );
    expect(await screen.findByText(/SOLICITUD ENVIADA/)).toBeDefined();
  });

  it("muestra el error de plazo vencido al crear la devolución", async () => {
    params.value = new URLSearchParams("pedidoId=PED-2026-00002");
    crearDevolucion.mockRejectedValue({ response: { status: 400, data: { code: "PLAZO_VENCIDO" } } });
    renderPage();

    await screen.findByText(/Solicitar devolución/);
    fireEvent.click(screen.getByRole("button", { name: /ENVIAR SOLICITUD/ }));

    expect(await screen.findByText(/plazo de 7 días/)).toBeDefined();
  });

  it("muestra el error de pedido no entregado al crear la devolución", async () => {
    params.value = new URLSearchParams("pedidoId=PED-2026-00002");
    crearDevolucion.mockRejectedValue({
      response: { status: 409, data: { code: "PEDIDO_NO_ENTREGADO" } },
    });
    renderPage();

    await screen.findByText(/Solicitar devolución/);
    fireEvent.click(screen.getByRole("button", { name: /ENVIAR SOLICITUD/ }));

    expect(await screen.findByText(/Solo puedes solicitar un cambio o devolución de un pedido entregado/)).toBeDefined();
  });

  it("genera un solo POST con 2 items y 3 evidencias subidas", async () => {
    params.value = new URLSearchParams("pedidoId=PED-2026-00002");
    obtenerPedido.mockResolvedValueOnce({
      ...pedidoEntregado,
      items: [
        { productoId: "P-100", sku: "SKU-100", descripcion: "Zapatilla A", cantidad: 2, precioUnitario: 100 },
        { productoId: "P-101", sku: "SKU-101", descripcion: "Zapatilla B", cantidad: 1, precioUnitario: 100 },
      ],
    });
    renderPage();

    await screen.findByText(/Solicitar devolución/);

    fireEvent.click(screen.getByLabelText("Seleccionar Zapatilla B · SKU-101"));

    const f1 = new File(["a"], "f1.png", { type: "image/png" });
    const f2 = new File(["b"], "f2.png", { type: "image/png" });
    const f3 = new File(["c"], "f3.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Subir evidencia"), { target: { files: [f1, f2, f3] } });

    fireEvent.click(screen.getByRole("button", { name: /ENVIAR SOLICITUD/ }));

    await waitFor(() => expect(subirEvidencia).toHaveBeenCalledTimes(3));
    expect(crearDevolucion).toHaveBeenCalledTimes(1);
    expect(crearDevolucion).toHaveBeenCalledWith(expect.objectContaining({
      pedidoId: "PED-2026-00002",
      items: [
        { productoId: "P-100", cantidad: 1 },
        { productoId: "P-101", cantidad: 1 },
      ],
      evidencias: expect.arrayContaining([
        expect.objectContaining({ tipo: "IMAGEN" }),
      ]),
    }));
  });

  it("muestra servicio no disponible ante 503 y permite reintentar", async () => {
    params.value = new URLSearchParams("pedidoId=PED-2026-503");
    obtenerPedido
      .mockRejectedValueOnce({ response: { status: 503, data: { code: "SERVICIO_NO_DISPONIBLE" } } })
      .mockResolvedValueOnce(pedidoEntregado);

    renderPage();

    expect(await screen.findByText("Servicio no disponible")).toBeDefined();
    const reintentar = screen.getByRole("button", { name: "REINTENTAR" });
    fireEvent.click(reintentar);

    expect(await screen.findByText(/Solicitar devolución/)).toBeDefined();
  });
  });
});
