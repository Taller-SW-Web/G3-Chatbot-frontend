// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DevolucionPage } from "@/adapters/inbound/pages/DevolucionPage";
import { useChatStore } from "@/application/state/chatStore";

const push = vi.hoisted(() => vi.fn());
const params = vi.hoisted(() => ({ value: new URLSearchParams() }));
const obtenerPedido = vi.hoisted(() => vi.fn());
const crearDevolucion = vi.hoisted(() => vi.fn());
const subirEvidencia = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => params.value,
}));

vi.mock("@/infrastructure/di/container", () => ({
  container: {
    api: { obtenerPedido, crearDevolucion, subirEvidencia },
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
  });

  it("muestra el error de plazo vencido al crear la devolución", async () => {
    params.value = new URLSearchParams("pedidoId=PED-2026-00002");
    crearDevolucion.mockRejectedValue({ response: { status: 400, data: { code: "PLAZO_VENCIDO" } } });
    renderPage();

    await screen.findByText(/Solicitar devolución/);
    fireEvent.click(screen.getByRole("button", { name: /ENVIAR SOLICITUD/ }));

    expect(await screen.findByText(/plazo de 7 días/)).toBeDefined();
  });
});
