// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SeguimientoPage } from "@/modules/mod-orders/ui/SeguimientoPage";

const push = vi.hoisted(() => vi.fn());
const params = vi.hoisted(() => ({ value: new URLSearchParams() }));
const obtenerSeguimientoPedido = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => params.value,
}));

vi.mock("@/shared/di/container", () => ({
  container: {
    pedidos: { obtenerSeguimientoPedido },
  },
}));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <SeguimientoPage />
    </QueryClientProvider>
  );
}

const seguimiento = {
  pedidoId: "PED-2026-00002",
  estado: "EN_CAMINO",
  estadoEtiqueta: "En camino",
  fechaProgramada: "2026-11-21",
  distrito: "Miraflores",
  hitos: [
    {
      titulo: "Recibido en centro de despacho",
      fecha: "2026-11-20T10:00:00-05:00",
      completado: true,
    },
    {
      titulo: "En camino",
      fecha: "2026-11-20T14:30:00-05:00",
      completado: true,
    },
  ],
  recibidoPor: null,
  detalleDisponible: true,
  mensaje: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  params.value = new URLSearchParams();
  obtenerSeguimientoPedido.mockResolvedValue(seguimiento);
});

afterEach(cleanup);

describe("SeguimientoPage", () => {
  it("pide elegir un pedido cuando no hay pedidoId", () => {
    renderPage();

    expect(screen.getByText("Seguimiento del pedido")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "IR A MIS PEDIDOS" }));
    expect(push).toHaveBeenCalledWith("/pedidos");
  });

  it("muestra carga mientras consulta el seguimiento", () => {
    params.value = new URLSearchParams("pedidoId=PED-2026-00002");
    obtenerSeguimientoPedido.mockReturnValue(new Promise(() => {}));
    renderPage();

    expect(screen.getByText(/Consultando el seguimiento/)).toBeDefined();
  });

  it("muestra los datos y los hitos del despacho", async () => {
    params.value = new URLSearchParams("pedidoId=PED-2026-00002");
    renderPage();

    expect(await screen.findByText(/Pedido PED-2026-00002/)).toBeDefined();
    expect(screen.getByText(/Miraflores/)).toBeDefined();
    expect(screen.getByText("Recibido en centro de despacho")).toBeDefined();
    expect(screen.getByText("En camino")).toBeDefined();
    expect((screen.getByRole("button", { name: /Preguntar en el chat/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("muestra el fallback cuando el despacho aún no tiene detalle", async () => {
    params.value = new URLSearchParams("pedidoId=PED-2026-00002");
    obtenerSeguimientoPedido.mockResolvedValue({
      ...seguimiento,
      estado: "PAGADO",
      estadoEtiqueta: "Pago confirmado",
      detalleDisponible: false,
      hitos: [],
      mensaje: "Tu pedido aún se está preparando.",
    });
    renderPage();

    expect(await screen.findByText("Tu pedido aún se está preparando.")).toBeDefined();
    expect(screen.getByText(/Todavía no hay hitos/)).toBeDefined();
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeDefined();
  });

  it("muestra error y permite reintentar", async () => {
    params.value = new URLSearchParams("pedidoId=PED-2026-00002");
    obtenerSeguimientoPedido.mockRejectedValue(new Error("sin red"));
    renderPage();

    expect(await screen.findByText(/No pudimos consultar el seguimiento/)).toBeDefined();
    expect(screen.getByRole("button", { name: "REINTENTAR" })).toBeDefined();
  });
});
