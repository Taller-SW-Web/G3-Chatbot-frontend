// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReclamoPage } from "@/modules/mod-postventa/ui/ReclamoPage";

const push = vi.hoisted(() => vi.fn());
const params = vi.hoisted(() => ({ value: new URLSearchParams() }));
const fetchProfile = vi.hoisted(() => vi.fn());
const crearReclamo = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => params.value,
}));

vi.mock("@/shared/di/container", () => ({
  container: {
    auth: { fetchProfile },
    postventa: { crearReclamo },
  },
}));

const PERFIL = {
  id: "11111111-1111-1111-1111-111111111111",
  nombreCompleto: "Ana Pérez",
  correo: "ana@example.com",
  celular: "+51999888777",
  celularVerificado: true,
  ultimoDocumento: { tipo: "DNI", numeroEnmascarado: "****5678" },
};

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(["perfil"], PERFIL);
  return render(
    <QueryClientProvider client={client}>
      <ReclamoPage />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  params.value = new URLSearchParams();
  fetchProfile.mockResolvedValue(PERFIL);
  crearReclamo.mockResolvedValue({
    reclamoId: "REC-2026-0119",
    codigoSeguimiento: "REC-2026-0119",
    pedidoId: "PED-2026-00002",
    tipo: "RECLAMO",
    motivo: "PRODUCTO_DEFECTUOSO",
    estado: "REGISTRADO",
    fechaRegistro: "2026-11-20T10:00:00Z",
    fechaLimiteSLA: "2026-12-11T23:59:59Z",
  });
});

afterEach(cleanup);

describe("ReclamoPage", () => {
  it("pide elegir un pedido cuando no hay pedidoId", () => {
    renderPage();

    expect(screen.getByText("Registrar un reclamo")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "IR A MIS PEDIDOS" }));
    expect(push).toHaveBeenCalledWith("/pedidos");
  });

  it("registra el reclamo y muestra el código de seguimiento", async () => {
    params.value = new URLSearchParams("pedidoId=PED-2026-00002");
    renderPage();

    await screen.findByDisplayValue("+51999888777");
    fireEvent.change(await screen.findByLabelText(/Descripci.n del reclamo/), {
      target: { value: "El producto llegó defectuoso y no funciona correctamente." },
    });
    fireEvent.change(screen.getByLabelText("Documento"), {
      target: { value: "12345678" },
    });
    fireEvent.change(screen.getByLabelText(/Tel.fono/), {
      target: { value: "+51999888777" },
    });
    fireEvent.click(screen.getByRole("button", { name: /ENVIAR RECLAMO/ }));

    await waitFor(() => expect(crearReclamo).toHaveBeenCalledWith(expect.objectContaining({
      pedidoId: "PED-2026-00002",
      tipo: "RECLAMO",
      motivo: "PRODUCTO_DEFECTUOSO",
      consumidor: expect.objectContaining({
        nombreCompleto: "Ana Pérez",
        documento: "12345678",
        email: "ana@example.com",
      }),
    })));
    expect(await screen.findByText(/SE REGISTR.*TU RECLAMO/)).toBeDefined();
    expect(screen.getByText(/REC-2026-0119/)).toBeDefined();
  });

  it("muestra error de validación al registrar el reclamo", async () => {
    params.value = new URLSearchParams("pedidoId=PED-2026-00002");
    crearReclamo.mockRejectedValue({ response: { status: 400, data: { code: "VALIDACION" } } });
    renderPage();

    await screen.findByDisplayValue("+51999888777");
    fireEvent.change(await screen.findByLabelText(/Descripci.n del reclamo/), {
      target: { value: "El producto llegó defectuoso y no funciona correctamente." },
    });
    fireEvent.change(screen.getByLabelText("Documento"), {
      target: { value: "12345678" },
    });
    fireEvent.change(screen.getByLabelText(/Tel.fono/), {
      target: { value: "+51999888777" },
    });
    fireEvent.click(screen.getByRole("button", { name: /ENVIAR RECLAMO/ }));

    expect(await screen.findByText(/Revisa los datos del formulario/)).toBeDefined();
  });
});
