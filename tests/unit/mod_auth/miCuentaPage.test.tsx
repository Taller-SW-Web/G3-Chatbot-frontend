// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MiCuentaPage } from "@/modules/mod-auth/ui/MiCuentaPage";
import { useChatStore } from "@/shared/auth/chatStore";
import { queryClient } from "@/shared/di/queryClient";

const api = vi.hoisted(() => ({
  solicitarOtpCelular: vi.fn(),
  verificarOtpCelular: vi.fn(),
  validarContactoCelular: vi.fn(),
  fetchProfile: vi.fn(),
  logout: vi.fn(),
}));
const push = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/shared/di/container", () => ({ container: { auth: api } }));

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
  api.solicitarOtpCelular.mockResolvedValue({
    enviado: true,
    celularEnmascarado: "*****321",
    expiraEn: new Date(Date.now() + 300_000).toISOString(),
  });
  api.verificarOtpCelular.mockResolvedValue({
    celularVerificado: true,
    celularEnmascarado: "*****321",
  });
  api.validarContactoCelular.mockResolvedValue({ verificado: true });
  api.fetchProfile.mockResolvedValue({
    id: "u1",
    nombreCompleto: "Ana Torres",
    correo: "ana@ejemplo.pe",
  });
  api.logout.mockImplementation(async () => {
    useChatStore.getState().logout();
    return { ok: true };
  });
});

afterEach(cleanup);

describe("MiCuentaPage", () => {
  it("sin sesión pide iniciar sesión y vuelve al inicio", () => {
    render(<MiCuentaPage />);

    expect(screen.getByText("Inicia sesión para ver tu cuenta.")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "VOLVER AL INICIO" }));
    expect(push).toHaveBeenCalledWith("/");
  });

  it("muestra los datos del cliente y el estado de su celular sin inventar documento", () => {
    useChatStore.setState({ cliente: cliente() });
    render(<MiCuentaPage />);

    expect(screen.getByText("Ana Torres")).toBeDefined();
    expect(screen.getByText("ana@ejemplo.pe")).toBeDefined();
    expect(screen.getByText("Celular (opcional)")).toBeDefined();
    expect(screen.getByText("*****321")).toBeDefined();
    expect(screen.getByText("Sin verificar")).toBeDefined();
    expect(screen.queryByText("Documento")).toBeNull();
    expect(screen.getByRole("button", { name: "VERIFICAR CELULAR" })).toBeDefined();
  });

  it("sin documento registrado no muestra la fila de documento (SPEC-03)", () => {
    useChatStore.setState({ cliente: cliente({ tipoDocumento: undefined, documentoEnmascarado: undefined }) });
    render(<MiCuentaPage />);

    expect(screen.queryByText("Documento")).toBeNull();
  });

  it("sin celular no muestra botón que falle (SPEC-03)", () => {
    useChatStore.setState({ cliente: cliente({ celularEnmascarado: undefined, celular: undefined }) });
    render(<MiCuentaPage />);

    expect(screen.getByText("—")).toBeDefined();
    expect(screen.queryByRole("button", { name: "VERIFICAR CELULAR" })).toBeNull();
  });

  it("perfil no disponible muestra mensaje de error y permite reintentar sin borrar el token (SPEC-03)", async () => {
    useChatStore.setState({ accessToken: "jwt_token", cliente: null });
    api.fetchProfile.mockResolvedValueOnce({
      id: "u1",
      nombreCompleto: "Ana Torres Recuperada",
      correo: "ana@ejemplo.pe",
    });

    render(<MiCuentaPage />);

    expect(screen.getByText("No pudimos cargar tus datos en este momento")).toBeDefined();
    const retryBtn = screen.getByRole("button", { name: "REINTENTAR" });
    expect(retryBtn).toBeDefined();
    expect(screen.getByRole("button", { name: "CERRAR SESIÓN" })).toBeDefined();

    fireEvent.click(retryBtn);

    await waitFor(() => expect(screen.getByText("Ana Torres Recuperada")).toBeDefined());
    expect(useChatStore.getState().accessToken).toBe("jwt_token");
  });

  it("verifica el celular con el código de 6 dígitos", async () => {
    useChatStore.setState({ cliente: cliente() });
    render(<MiCuentaPage />);

    fireEvent.click(screen.getByRole("button", { name: "VERIFICAR CELULAR" }));
    expect(screen.getByText(/Para coordinar la entrega necesitamos confirmar tu celular/)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "ENVIAR CÓDIGO" }));
    expect(await screen.findByText("Ingresa el código de 6 dígitos")).toBeDefined();

    fireEvent.change(screen.getByLabelText("Código de verificación"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "VERIFICAR" }));

    await waitFor(() => expect(api.verificarOtpCelular).toHaveBeenCalledWith("123456"));
    expect(useChatStore.getState().cliente?.celularVerificado).toBe(true);
    expect(screen.getByText("Celular verificado")).toBeDefined();
  });

  it("conserva el celular sin verificar si el código no es válido", async () => {
    api.verificarOtpCelular.mockResolvedValue({
      celularVerificado: false,
      celularEnmascarado: "*****321",
    });
    useChatStore.setState({ cliente: cliente() });
    render(<MiCuentaPage />);

    fireEvent.click(screen.getByRole("button", { name: "VERIFICAR CELULAR" }));
    fireEvent.click(screen.getByRole("button", { name: "ENVIAR CÓDIGO" }));
    await screen.findByText("Ingresa el código de 6 dígitos");
    fireEvent.change(screen.getByLabelText("Código de verificación"), { target: { value: "000000" } });
    fireEvent.click(screen.getByRole("button", { name: "VERIFICAR" }));

    expect(await screen.findByRole("alert")).toBeDefined();
    expect(screen.getByText(/No pudimos verificar el c.digo/)).toBeDefined();
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

  it("cierra la sesión por la API, limpia ids persistidos y la caché, y vuelve al inicio", async () => {
    queryClient.setQueryData(["pedidos"], [{ id: "p1" }]);
    useChatStore.setState({
      cliente: cliente(),
      accessToken: "jwt",
      ultimaConversacionId: "c1",
      ultimoPedido: { orderId: "PED-1" } as never,
    });
    render(<MiCuentaPage />);

    fireEvent.click(screen.getByRole("button", { name: "CERRAR SESIÓN" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
    expect(api.logout).toHaveBeenCalledTimes(1);
    const s = useChatStore.getState();
    expect(s.cliente).toBeNull();
    expect(s.accessToken).toBeNull();
    expect(s.ultimaConversacionId).toBeNull();
    expect(s.ultimoPedido).toBeNull();
    expect(queryClient.getQueryData(["pedidos"])).toBeUndefined();
  });

  it("limpia el estado local aunque la API de logout falle", async () => {
    api.logout.mockRejectedValue(new Error("network"));
    useChatStore.setState({ cliente: cliente(), accessToken: "jwt" });
    render(<MiCuentaPage />);

    fireEvent.click(screen.getByRole("button", { name: "CERRAR SESIÓN" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
    expect(useChatStore.getState().accessToken).toBeNull();
  });

  it("muestra la sección informativa de seguridad/marketplace sin campos editables", () => {
    useChatStore.setState({ cliente: cliente() });
    render(<MiCuentaPage />);

    expect(screen.getByText(/SE EDITA EN SEGURIDAD/)).toBeDefined();
    expect(screen.getByText("Contraseña y MFA")).toBeDefined();
  });
});
