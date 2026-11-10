// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MiCuentaPage } from "@/adapters/inbound/pages/MiCuentaPage";
import { useChatStore } from "@/application/state/chatStore";

const api = vi.hoisted(() => ({ validarContactoCelular: vi.fn() }));
const push = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/infrastructure/di/container", () => ({ container: { api, stream: {} } }));

function cliente(extra: Record<string, unknown> = {}) {
  return {
    id: "u1",
    nombreCompleto: "Ana Torres",
    correo: "ana@ejemplo.pe",
    celular: "987654321",
    celularEnmascarado: "*****321",
    celularVerificado: false,
    ...extra,
  } as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  useChatStore.setState({ cliente: null, accessToken: null });
  api.validarContactoCelular.mockResolvedValue({ verificado: true });
});

afterEach(cleanup);

describe("MiCuentaPage", () => {
  it("sin sesión pide iniciar sesión y vuelve al inicio", () => {
    render(<MiCuentaPage />);

    expect(screen.getByText("Inicia sesión para ver tu cuenta.")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "VOLVER AL INICIO" }));
    expect(push).toHaveBeenCalledWith("/");
  });

  it("muestra los datos del cliente y el estado de su celular", () => {
    useChatStore.setState({ cliente: cliente() });
    render(<MiCuentaPage />);

    expect(screen.getByText("Ana Torres")).toBeDefined();
    expect(screen.getByText("ana@ejemplo.pe")).toBeDefined();
    expect(screen.getByText("*****321")).toBeDefined();
    expect(screen.getByText("Sin verificar")).toBeDefined();
    expect(screen.getByText("No registrado")).toBeDefined();
    expect(screen.getByRole("button", { name: "VERIFICAR CELULAR" })).toBeDefined();
  });

  it("verifica el celular con el código de 6 dígitos", async () => {
    useChatStore.setState({ cliente: cliente() });
    render(<MiCuentaPage />);

    fireEvent.click(screen.getByRole("button", { name: "VERIFICAR CELULAR" }));
    expect(screen.getByText(/Para coordinar la entrega necesitamos confirmar tu celular/)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "ENVIAR CÓDIGO" }));
    expect(screen.getByText("Ingresa el código de 6 dígitos")).toBeDefined();

    fireEvent.change(screen.getByLabelText(/C.digo celular 6 d.gitos/), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "VERIFICAR" }));

    await waitFor(() => expect(api.validarContactoCelular).toHaveBeenCalledWith("123456"));
    expect(useChatStore.getState().cliente?.celularVerificado).toBe(true);
    expect(screen.getByText("Celular verificado")).toBeDefined();
  });

  it("conserva el celular sin verificar si el código no es válido", async () => {
    api.validarContactoCelular.mockResolvedValue({ verificado: false });
    useChatStore.setState({ cliente: cliente() });
    render(<MiCuentaPage />);

    fireEvent.click(screen.getByRole("button", { name: "VERIFICAR CELULAR" }));
    fireEvent.click(screen.getByRole("button", { name: "ENVIAR CÓDIGO" }));
    fireEvent.change(screen.getByLabelText(/C.digo celular 6 d.gitos/), { target: { value: "000000" } });
    fireEvent.click(screen.getByRole("button", { name: "VERIFICAR" }));

    await waitFor(() => expect(api.validarContactoCelular).toHaveBeenCalled());
    expect(useChatStore.getState().cliente?.celularVerificado).toBe(false);
    expect(screen.getByText("Sin verificar")).toBeDefined();
  });

  it("con el celular ya verificado no vuelve a pedir el código", () => {
    useChatStore.setState({ cliente: cliente({ celularVerificado: true }) });
    render(<MiCuentaPage />);

    expect(screen.getByText("Celular verificado")).toBeDefined();
    expect(screen.queryByRole("button", { name: "VERIFICAR CELULAR" })).toBeNull();
  });

  it("muestra el documento cuando está registrado", () => {
    useChatStore.setState({
      cliente: cliente({ tipoDocumento: "DNI", documentoEnmascarado: "****1234" }),
    });
    render(<MiCuentaPage />);

    expect(screen.getByText("DNI ****1234")).toBeDefined();
  });

  it("navega a pedidos, reclamos y sugerencias", () => {
    useChatStore.setState({ cliente: cliente() });
    render(<MiCuentaPage />);

    fireEvent.click(screen.getByRole("button", { name: "MIS PEDIDOS" }));
    expect(push).toHaveBeenCalledWith("/pedidos");
    fireEvent.click(screen.getByRole("button", { name: "MIS RECLAMOS" }));
    expect(push).toHaveBeenCalledWith("/pedidos/reclamos");
    fireEvent.click(screen.getByRole("button", { name: "ENVIAR SUGERENCIA / REPORTAR BUG" }));
    expect(push).toHaveBeenCalledWith("/sugerencias");
  });

  it("cierra la sesión y vuelve al inicio", () => {
    useChatStore.setState({ cliente: cliente(), accessToken: "jwt" });
    render(<MiCuentaPage />);

    fireEvent.click(screen.getByRole("button", { name: "CERRAR SESIÓN" }));

    expect(useChatStore.getState().cliente).toBeNull();
    expect(useChatStore.getState().accessToken).toBeNull();
    expect(push).toHaveBeenCalledWith("/");
  });
});
