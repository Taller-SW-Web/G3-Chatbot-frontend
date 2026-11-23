// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OrderDetailPage } from "@/modules/mod-orders/ui/OrderDetailPage";

const push = vi.hoisted(() => vi.fn());
const params = vi.hoisted(() => ({ value: new URLSearchParams() }));
const obtenerPedido = vi.hoisted(() => vi.fn());
const calificarPedido = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => params.value,
}));

vi.mock("@/shared/di/container", () => ({
  container: { pedidos: { obtenerPedido, calificarPedido } },
}));

const PEDIDO = {
  pedidoId: "PED-2026-00002",
  canal: "CHATBOT",
  estado: "ENTREGADO",
  estadoEtiqueta: "Entregado",
  total: 312.4,
  moneda: "PEN",
  fechaCreacion: "2026-11-02T10:00:00Z",
  items: [
    {
      productoId: "P-100",
      sku: "ZAP-RUN-42-NEG",
      descripcion: "Zapatilla Run 42/Negro",
      cantidad: 2,
      precioUnitario: 149.95,
    },
  ],
  envio: {
    destinatario: "Ana Pérez",
    distrito: "Miraflores",
    direccion: "Av. Larco 1234, dpto. 502",
    costo: 12.5,
    plazoEstimadoDias: 1,
  },
  historial: [
    { estado: "PAGADO", etiqueta: "Pago confirmado", fecha: "2026-11-02T10:02:00Z", completado: true },
    { estado: "ENTREGADO", etiqueta: "Pedido recibido", fecha: "2026-11-03T15:40:00Z", completado: true },
  ],
};

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <OrderDetailPage />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  params.value = new URLSearchParams("pedidoId=PED-2026-00002");
  obtenerPedido.mockResolvedValue(PEDIDO);
  calificarPedido.mockResolvedValue(undefined);
});

afterEach(cleanup);

describe("OrderDetailPage", () => {
  it("pide elegir un pedido cuando no hay pedidoId", () => {
    params.value = new URLSearchParams();
    renderPage();

    expect(screen.getByText("Detalle del pedido")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "IR A MIS PEDIDOS" }));
    expect(push).toHaveBeenCalledWith("/pedidos");
  });

  it("renderiza cabecera, items, envío e historial reales", async () => {
    renderPage();

    expect(await screen.findByText("Pedido PED-2026-00002")).toBeDefined();
    expect(screen.getByText("Entregado")).toBeDefined();
    expect(screen.getByText("Zapatilla Run 42/Negro")).toBeDefined();
    expect(screen.getByText(/Cant\. 2/)).toBeDefined();
    expect(screen.getByText("S/ 149.95")).toBeDefined();
    expect(screen.getByText("Miraflores")).toBeDefined();
    expect(screen.getByText("Av. Larco 1234, dpto. 502")).toBeDefined();
    expect(screen.getByText("1 día")).toBeDefined();
    expect(screen.getByText("Pago confirmado")).toBeDefined();
    expect(screen.getByText("Pedido recibido")).toBeDefined();
    expect(screen.getByText("PAGADO")).toBeDefined();
    expect(obtenerPedido).toHaveBeenCalledWith("PED-2026-00002");
  });

  it("califica un pedido ENTREGADO con comentario desde el pie del detalle", async () => {
    renderPage();

    expect(await screen.findByLabelText("Calificar entrega del pedido PED-2026-00002")).toBeDefined();
    expect(screen.getByText("Califica tu entrega")).toBeDefined();
    fireEvent.click(screen.getByRole("radio", { name: "Regular" }));
    fireEvent.change(screen.getByLabelText(/Comentario/), { target: { value: "Llegó con retraso" } });
    fireEvent.click(screen.getByRole("button", { name: "ENVIAR CALIFICACIÓN" }));

    await waitFor(() =>
      expect(calificarPedido).toHaveBeenCalledWith("PED-2026-00002", 3, "Llegó con retraso")
    );
  });

  it("si Ventas responde ORDER_NOT_DELIVERED refresca el detalle y oculta el CSAT", async () => {
    obtenerPedido
      .mockResolvedValueOnce(PEDIDO)
      .mockResolvedValueOnce({
        ...PEDIDO,
        estado: "ANULADO",
        estadoEtiqueta: "Anulado",
      });
    calificarPedido.mockRejectedValue({
      response: { status: 422, data: { code: "ORDER_NOT_DELIVERED" } },
    });
    renderPage();

    expect(await screen.findByLabelText("Calificar entrega del pedido PED-2026-00002")).toBeDefined();
    fireEvent.click(screen.getByRole("radio", { name: "Bien" }));
    fireEvent.click(screen.getByRole("button", { name: "ENVIAR CALIFICACIÓN" }));

    await waitFor(() => expect(obtenerPedido).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.queryByLabelText("Calificar entrega del pedido PED-2026-00002")).toBeNull()
    );
    expect(screen.getByText("Anulado")).toBeDefined();
  });

  it("no muestra el CSAT si el pedido no está ENTREGADO", async () => {
    obtenerPedido.mockResolvedValue({
      ...PEDIDO,
      estado: "EN_PREPARACION",
      estadoEtiqueta: "En preparación",
      historial: [
        { estado: "PAGADO", etiqueta: "Pago confirmado", fecha: "2026-11-02T10:02:00Z", completado: true },
      ],
    });
    renderPage();

    expect(await screen.findByText("Pedido PED-2026-00002")).toBeDefined();
    expect(screen.queryByLabelText("Calificar entrega del pedido PED-2026-00002")).toBeNull();
  });

  it("no inventa el bloque de envío cuando el pedido no lo trae", async () => {
    obtenerPedido.mockResolvedValue({ ...PEDIDO, envio: null });
    renderPage();

    expect(await screen.findByText("Pedido PED-2026-00002")).toBeDefined();
    expect(screen.queryByText("Envío")).toBeNull();
  });

  it("ofrece reintentar cuando la consulta falla por red", async () => {
    obtenerPedido.mockRejectedValue(new Error("network down"));
    renderPage();

    expect(await screen.findByText("No pudimos consultar el pedido")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "REINTENTAR" }));
    await waitFor(() => expect(obtenerPedido).toHaveBeenCalledTimes(2));
  });
});
