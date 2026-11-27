// @vitest-environment jsdom
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OrderDetailPage } from "@/modules/mod-orders/ui/OrderDetailPage";

const push = vi.hoisted(() => vi.fn());
const params = vi.hoisted(() => ({ value: new URLSearchParams() }));
const obtenerPedido = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => params.value,
}));

vi.mock("@/shared/di/container", () => ({
  container: { pedidos: { obtenerPedido } },
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

function renderPage(csatSlot?: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <OrderDetailPage csatSlot={csatSlot} />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  params.value = new URLSearchParams("pedidoId=PED-2026-00002");
  obtenerPedido.mockResolvedValue(PEDIDO);
});

afterEach(cleanup);

describe("OrderDetailPage", () => {
  it("pide elegir un pedido cuando no hay pedidoId", () => {
    params.value = new URLSearchParams();
    renderPage(<p>Slot CSAT</p>);

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

  it("muestra el slot CSAT cuando el pedido está ENTREGADO y sin calificar", async () => {
    renderPage(<p>Slot CSAT</p>);

    expect(await screen.findByText("Pedido PED-2026-00002")).toBeDefined();
    expect(screen.getByText("Slot CSAT")).toBeDefined();
  });

  it("no muestra el slot CSAT si el pedido no está ENTREGADO", async () => {
    obtenerPedido.mockResolvedValue({
      ...PEDIDO,
      estado: "EN_PREPARACION",
      estadoEtiqueta: "En preparación",
      historial: [
        { estado: "PAGADO", etiqueta: "Pago confirmado", fecha: "2026-11-02T10:02:00Z", completado: true },
      ],
    });
    renderPage(<p>Slot CSAT</p>);

    expect(await screen.findByText("Pedido PED-2026-00002")).toBeDefined();
    expect(screen.queryByText("Slot CSAT")).toBeNull();
  });

  it("no muestra el slot CSAT cuando el cliente ya calificó la entrega", async () => {
    obtenerPedido.mockResolvedValue({ ...PEDIDO, csatEnviado: true });
    renderPage(<p>Slot CSAT</p>);

    expect(await screen.findByText("Pedido PED-2026-00002")).toBeDefined();
    expect(screen.queryByText("Slot CSAT")).toBeNull();
  });

  it("no inventa el bloque de envío cuando el pedido no lo trae", async () => {
    obtenerPedido.mockResolvedValue({ ...PEDIDO, envio: null });
    renderPage(<p>Slot CSAT</p>);

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

  it("muestra motivo de anulación por falta de stock y aviso de reembolso cuando el pedido está ANULADO", async () => {
    obtenerPedido.mockResolvedValue({
      ...PEDIDO,
      estado: "ANULADO",
      estadoEtiqueta: "Anulado",
      motivoAnulacion: "STOCK_NO_DISPONIBLE",
      reembolso: "Si corresponde un reembolso, se procesará al medio de pago original.",
      historial: [
        { estado: "CREADO", etiqueta: "Pendiente de pago", fecha: "2026-11-02T10:00:00Z", completado: true },
        { estado: "ANULADO", etiqueta: "Anulado", motivo: "STOCK_NO_DISPONIBLE", fecha: "2026-11-02T10:05:00Z", completado: true },
      ],
    });
    renderPage();

    expect(await screen.findByText("Pedido PED-2026-00002")).toBeDefined();
    expect(screen.getAllByText("Anulado por falta de stock").length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText(/El pedido fue anulado debido a que no hay stock disponible/i)
    ).toBeDefined();
    expect(
      screen.getByText("Si corresponde un reembolso, se procesará al medio de pago original.")
    ).toBeDefined();
    expect(screen.getByText("Motivo: Falta de stock")).toBeDefined();
    expect(screen.queryByText("Pago confirmado")).toBeNull();
    expect(screen.queryByText(/Slot CSAT/)).toBeNull();
  });

  it("renderiza esqueleto accesible de carga mientras consulta el pedido", () => {
    obtenerPedido.mockReturnValue(new Promise(() => {}));
    renderPage();

    const loading = screen.getByRole("status", { name: "Cargando detalle del pedido" });
    expect(loading).toBeDefined();
    expect(screen.getByText("Cargando pedido…")).toBeDefined();
  });

  it("muestra mensaje de lista de productos vacía", async () => {
    obtenerPedido.mockResolvedValue({ ...PEDIDO, items: [] });
    renderPage();

    expect(await screen.findByText("Este pedido no tiene productos registrados.")).toBeDefined();
  });
});
