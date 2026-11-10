// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactElement } from "react";
import { Sidebar } from "@/adapters/inbound/pages/Sidebar";
import { useChatStore } from "@/application/state/chatStore";
import type { ConversacionResumen } from "@/ports/outbound/ChatbotApiPort";

const api = vi.hoisted(() => ({
  listarConversaciones: vi.fn(),
  buscarConversaciones: vi.fn(),
  crearConversacion: vi.fn(),
}));

vi.mock("@/infrastructure/di/container", () => ({ container: { api, stream: {} } }));

function resumen(id: string, titulo = `Chat ${id}`, preview = "Un mensaje"): ConversacionResumen {
  return { id, titulo, preview, ultimoMensajeEn: "2026-11-09T00:00:00Z" };
}

const onClose = vi.fn();
const onNavigate = vi.fn();

function montar(ui: ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(createElement(QueryClientProvider, { client: queryClient }, ui));
}

function abrir(conversacionActual?: string) {
  return montar(createElement(Sidebar, { onClose, onNavigate, conversacionActual }));
}

beforeEach(() => {
  vi.clearAllMocks();
  useChatStore.setState({ cliente: null });
  api.listarConversaciones.mockResolvedValue([]);
  api.buscarConversaciones.mockResolvedValue([]);
  api.crearConversacion.mockResolvedValue({ conversacionId: "nueva" });
});

afterEach(cleanup);

describe("Sidebar", () => {
  it("lista las conversaciones recientes y navega al elegirlas", async () => {
    api.listarConversaciones.mockResolvedValue([resumen("a", "Tallas", "¿Tienes 42?")]);
    abrir();

    expect(screen.getByText("Cargando…")).toBeDefined();
    const fila = await screen.findByText("Tallas");
    expect(screen.getByText("¿Tienes 42?")).toBeDefined();

    fireEvent.click(fila);
    expect(onNavigate).toHaveBeenCalledWith("/chat/a");
    expect(api.listarConversaciones).toHaveBeenCalledWith(1);
  });

  it("marca la conversación abierta como actual", async () => {
    api.listarConversaciones.mockResolvedValue([resumen("a")]);
    abrir("a");

    const fila = await screen.findByText("Chat a");
    expect(fila.closest("button")?.getAttribute("aria-current")).toBe("page");
  });

  it("muestra el vacío cuando no hay conversaciones", async () => {
    abrir();
    expect(await screen.findByText("Aún no tienes conversaciones.")).toBeDefined();
  });

  it("ofrece reintentar cuando el listado falla", async () => {
    api.listarConversaciones.mockRejectedValueOnce(new Error("sin red")).mockResolvedValue([resumen("a")]);
    abrir();

    expect(await screen.findByRole("alert")).toBeDefined();
    fireEvent.click(screen.getByText("Reintentar"));

    expect(await screen.findByText("Chat a")).toBeDefined();
    expect(api.listarConversaciones).toHaveBeenCalledTimes(2);
  });

  it("pide la página siguiente con Ver más", async () => {
    const primera = Array.from({ length: 20 }, (_, i) => resumen(`c${i}`));
    api.listarConversaciones.mockResolvedValueOnce(primera).mockResolvedValueOnce([resumen("ultima")]);
    abrir();

    fireEvent.click(await screen.findByText("Ver más"));

    expect(await screen.findByText("Chat ultima")).toBeDefined();
    expect(api.listarConversaciones).toHaveBeenCalledWith(2);
  });

  it("crea un chat nuevo y navega a él", async () => {
    abrir();

    fireEvent.click(screen.getByText("Nuevo chat"));

    await waitFor(() => expect(onNavigate).toHaveBeenCalledWith("/chat/nueva"));
    expect(api.crearConversacion).toHaveBeenCalledTimes(1);
  });

  it("avisa si el chat nuevo no se pudo crear", async () => {
    api.crearConversacion.mockRejectedValue(new Error("caído"));
    abrir();

    fireEvent.click(screen.getByText("Nuevo chat"));

    expect(
      await screen.findByText("No se pudo crear el chat. Inténtalo de nuevo.")
    ).toBeDefined();
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("busca con debounce, enfoca el campo y resalta la coincidencia", async () => {
    api.buscarConversaciones.mockResolvedValue([
      {
        ...resumen("z1", "Zapatillas", "Zapatillas para asfalto"),
        resaltado: {
          titulo: [
            { texto: "Zapa", coincide: true },
            { texto: "tillas", coincide: false },
          ],
          fragmento: null,
        },
      },
    ]);
    abrir();

    fireEvent.click(screen.getByText("Buscar chats"));
    const input = screen.getByLabelText("Buscar conversaciones") as HTMLInputElement;
    expect(document.activeElement).toBe(input);

    fireEvent.change(input, { target: { value: "  zapa  " } });
    await waitFor(() => expect(api.buscarConversaciones).toHaveBeenCalledWith("zapa", 1));

    const marca = await screen.findByText("Zapa");
    expect(marca.tagName).toBe("MARK");
    expect(screen.getByText("tillas")).toBeDefined();
  });

  it("sin término muestra las recientes y un vacío propio", async () => {
    abrir();

    fireEvent.click(screen.getByText("Buscar chats"));
    expect(await screen.findByText("Aún no tienes conversaciones.")).toBeDefined();
    expect(api.buscarConversaciones).not.toHaveBeenCalled();
  });

  it("la búsqueda sin coincidencias avisa con un mensaje distinto", async () => {
    abrir();

    fireEvent.click(screen.getByText("Buscar chats"));
    fireEvent.change(screen.getByLabelText("Buscar conversaciones"), { target: { value: "nada" } });

    expect(await screen.findByText("Sin resultados.")).toBeDefined();
  });

  it("cierra la búsqueda y vuelve al menú", async () => {
    abrir();

    fireEvent.click(screen.getByText("Buscar chats"));
    fireEvent.click(screen.getByLabelText("Cerrar búsqueda"));

    expect(screen.getByText("Nuevo chat")).toBeDefined();
    expect(screen.queryByLabelText("Buscar conversaciones")).toBeNull();
  });

  it("muestra la sesión activa en el pie y lleva a la cuenta", () => {
    useChatStore.setState({
      cliente: { id: "u1", nombreCompleto: "ana torres", correo: "ana@ejemplo.pe" } as never,
    });
    abrir();

    expect(screen.getByText("A")).toBeDefined();
    fireEvent.click(screen.getByText("ana torres"));
    expect(onNavigate).toHaveBeenCalledWith("/cuenta");
  });

  it("sin sesión ofrece iniciar sesión y abre el modal", () => {
    abrir();

    expect(screen.getByText("Iniciar sesión")).toBeDefined();
    fireEvent.click(screen.getByText("Iniciar sesión"));

    expect(useChatStore.getState().authOpen).toBe(true);
    expect(useChatStore.getState().accionPendiente).toBe("/cuenta");
    expect(onNavigate).not.toHaveBeenCalled();
  });
});
