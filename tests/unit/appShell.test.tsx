// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { AppShell } from "@/adapters/inbound/pages/AppShell";
import { useChatStore } from "@/application/state/chatStore";

const nav = vi.hoisted(() => ({ push: vi.fn() }));
const api = vi.hoisted(() => ({
  refreshSession: vi.fn(),
  fetchProfile: vi.fn(),
  listarConversaciones: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: nav.push }) }));
vi.mock("@/infrastructure/di/container", () => ({ container: { api, stream: {} } }));
vi.mock("@/application/hooks/useCarrito", () => ({ useCarrito: vi.fn() }));

function resetStore() {
  useChatStore.setState({
    accessToken: null,
    expiraEn: null,
    chatSid: null,
    cliente: null,
    carrito: { lineas: [], subtotal: 0, count: 0 },
    accionPendiente: null,
    authOpen: false,
    authVista: "login",
    ultimoPedido: null,
    primerMensaje: null,
    ultimaConversacionId: null,
  });
  localStorage.clear();
  nav.push.mockClear();
  api.refreshSession.mockReset();
  api.refreshSession.mockRejectedValue(new Error("sin sesión"));
  api.fetchProfile.mockReset();
  api.listarConversaciones.mockReset();
  api.listarConversaciones.mockResolvedValue([]);
  api.logout.mockReset();
  api.logout.mockResolvedValue({ ok: true });
  window.history.replaceState(null, "", "/");
}

function montar(ui: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(createElement(QueryClientProvider, { client: queryClient }, ui));
}

function shell(initialScreen: Parameters<typeof AppShell>[0]["initialScreen"], conversationId?: string) {
  return createElement(
    AppShell,
    { initialScreen, conversationId },
    createElement("p", null, "contenido de la pantalla")
  );
}

beforeEach(resetStore);
afterEach(cleanup);

describe("AppShell", () => {
  it("en el inicio muestra el menú, el logo y el badge del carrito", () => {
    useChatStore.setState({ carrito: { lineas: [], subtotal: 0, count: 3 } });
    montar(shell("home"));

    expect(screen.getByLabelText("Abrir menú")).toBeDefined();
    expect(screen.getByLabelText("Ir a inicio")).toBeDefined();
    expect(screen.getByLabelText("Ver carrito")).toBeDefined();
    expect(screen.getByText("3")).toBeDefined();
    expect(screen.getByText("contenido de la pantalla")).toBeDefined();
  });

  it("sin productos en el carrito no pinta badge", () => {
    montar(shell("home"));
    expect(screen.queryByText("0")).toBeNull();
  });

  it("en una pantalla interna titula y vuelve al inicio", () => {
    montar(shell("carrito"));

    expect(screen.getByText("CARRITO")).toBeDefined();
    fireEvent.click(screen.getByLabelText("Volver"));
    expect(nav.push).toHaveBeenCalledWith("/");
  });

  it.each([
    ["checkout", "CHECKOUT"],
    ["exito", "PEDIDO"],
    ["pedidos", "HISTORIAL DE PEDIDOS"],
    ["seguimiento", "SEGUIMIENTO"],
    ["reclamo", "RECLAMO"],
    ["devolucion", "DEVOLUCIÓN"],
    ["cuenta", "MI CUENTA"],
    ["sugerencias", "SUGERENCIAS"],
    ["verificar-correo", "VERIFICAR CORREO"],
  ] as const)("titula la pantalla %s", (screen_, titulo) => {
    montar(shell(screen_));
    expect(screen.getByText(titulo)).toBeDefined();
  });

  it("abre y cierra la barra lateral", () => {
    montar(shell("home"));

    fireEvent.click(screen.getByLabelText("Abrir menú"));
    expect(screen.getByText("Nuevo chat")).toBeDefined();

    fireEvent.click(screen.getByLabelText("Cerrar menú"));
    expect(screen.queryByText("Nuevo chat")).toBeNull();
  });

  it("pide iniciar sesión al entrar a una sección privada sin cuenta", () => {
    montar(shell("home"));

    fireEvent.click(screen.getByLabelText("Abrir menú"));
    fireEvent.click(screen.getByText("Historial de pedidos"));

    expect(useChatStore.getState().authOpen).toBe(true);
    expect(useChatStore.getState().accionPendiente).toBe("/pedidos");
    expect(nav.push).not.toHaveBeenCalled();
  });

  it("navega a la sección privada cuando hay sesión", () => {
    useChatStore.setState({
      cliente: { id: "u1", nombreCompleto: "Ana", correo: "ana@ejemplo.pe" } as never,
    });
    montar(shell("home"));

    fireEvent.click(screen.getByLabelText("Abrir menú"));
    fireEvent.click(screen.getByText("Historial de pedidos"));

    expect(nav.push).toHaveBeenCalledWith("/pedidos");
    expect(screen.queryByText("Nuevo chat")).toBeNull();
  });

  it("lleva al carrito desde el header", () => {
    montar(shell("home"));
    fireEvent.click(screen.getByLabelText("Ver carrito"));
    expect(nav.push).toHaveBeenCalledWith("/carrito");
  });

  it("abre el modal con ?abrirLogin=1 y conserva el destino pendiente", () => {
    window.history.replaceState(null, "", "/?abrirLogin=1&destino=/checkout");
    montar(shell("home"));

    expect(useChatStore.getState().authOpen).toBe(true);
    expect(useChatStore.getState().accionPendiente).toBe("/checkout");
    expect(window.location.search).toBe("");
    expect(screen.getByText("Inicia sesión")).toBeDefined();
  });

  it("abre el modal sin destino y limpia el parámetro de la URL", () => {
    window.history.replaceState(null, "", "/?abrirLogin=1&otros=1");
    montar(shell("home"));

    expect(useChatStore.getState().authOpen).toBe(true);
    expect(useChatStore.getState().accionPendiente).toBeNull();
    expect(window.location.search).toBe("?otros=1");
  });

  it("sin el parámetro no abre el modal", () => {
    window.history.replaceState(null, "", "/?otros=1");
    montar(shell("home"));
    expect(useChatStore.getState().authOpen).toBe(false);
  });

  it("restaura la sesión al arrancar sin token", async () => {
    api.refreshSession.mockResolvedValue({
      accessToken: "jwt-nuevo",
      expiresIn: 900,
      usuario: { id: "u1", nombreCompleto: "Ana Torres", correo: "ana@ejemplo.pe" },
    });
    api.fetchProfile.mockResolvedValue({
      id: "u1",
      nombreCompleto: "Ana Torres",
      correo: "ana@ejemplo.pe",
      celularVerificado: true,
      ultimoDocumento: null,
    });

    montar(shell("home"));

    await waitFor(() => expect(useChatStore.getState().cliente?.correo).toBe("ana@ejemplo.pe"));
    expect(useChatStore.getState().accessToken).toBe("jwt-nuevo");
    expect(api.fetchProfile).toHaveBeenCalledTimes(1);
  });

  it("cierra la sesión si la renovación falla", async () => {
    useChatStore.setState({ cliente: { id: "u1", nombreCompleto: "Ana", correo: "ana@ejemplo.pe" } as never });
    montar(shell("home"));

    await waitFor(() => expect(useChatStore.getState().accessToken).toBeNull());
    expect(useChatStore.getState().cliente).toBeNull();
  });

  it("con un token vigente no renueva contra el backend", () => {
    useChatStore.setState({ accessToken: "jwt-vigente", expiraEn: Date.now() + 10 * 60 * 1000 });
    montar(shell("home"));

    expect(api.refreshSession).not.toHaveBeenCalled();
  });

  it("renueva el token cuando está por expirar", async () => {
    useChatStore.setState({ accessToken: "jwt-por-expirar", expiraEn: Date.now() + 10_000 });
    api.refreshSession.mockResolvedValue({
      accessToken: "jwt-renovado",
      expiresIn: 900,
      usuario: { id: "u1", nombreCompleto: "Ana", correo: "ana@ejemplo.pe" },
    });
    api.fetchProfile.mockResolvedValue({
      id: "u1",
      nombreCompleto: "Ana",
      correo: "ana@ejemplo.pe",
      celularVerificado: true,
      ultimoDocumento: null,
    });

    montar(shell("home"));

    await waitFor(() => expect(useChatStore.getState().accessToken).toBe("jwt-renovado"));
    expect(api.refreshSession).toHaveBeenCalledTimes(1);
  });

  it("recuerda la conversación abierta para ubicar el carrito anónimo", async () => {
    montar(shell("chat", "11111111-1111-4111-8111-111111111111"));
    await waitFor(() =>
      expect(useChatStore.getState().ultimaConversacionId).toBe("11111111-1111-4111-8111-111111111111")
    );
  });

  it("ignora conversaciones que no son UUID al ubicar el carrito", async () => {
    montar(shell("chat", "fixture"));
    await waitFor(() => expect(api.refreshSession).toHaveBeenCalled());
    expect(useChatStore.getState().ultimaConversacionId).toBeNull();
  });
});
