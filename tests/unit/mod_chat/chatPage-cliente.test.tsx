// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChatPage } from "@/modules/mod-chat/ui/ChatPage";
import { useChatStore } from "@/shared/auth/chatStore";
import type { Mensaje } from "@/modules/mod-chat/domain/entities/Mensaje";

const h = vi.hoisted(() => ({
  push: vi.fn(),
  execute: vi.fn(),
  reload: vi.fn(),
  logout: vi.fn(),
  crear: vi.fn(),
  chatState: {
    mensajes: [] as Mensaje[],
    estado: "listo" as "listo" | "inactivo" | "cargando" | "enviando" | "error",
    historialCargado: true,
  },
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: h.push }) }));
vi.mock("@/shared/di/container", () => ({
  container: {
    chat: { crearConversacion: h.crear },
    auth: { logout: h.logout },
  },
}));
vi.mock("@/modules/mod-chat/application/ejecutarAccionChatUseCase", () => ({
  ejecutarAccionChatUseCase: h.execute,
}));
vi.mock("@/modules/mod-chat/application/useChat", () => ({
  useChat: () => ({
    mensajes: h.chatState.mensajes,
    borrador: null,
    estado: h.chatState.estado,
    error: null,
    incompleto: false,
    historialCargado: h.chatState.historialCargado,
    ultimoTexto: "",
    enviar: vi.fn(),
    reintentar: vi.fn(),
    recargar: vi.fn(),
    recargarSilencioso: h.reload,
  }),
}));

function mensajeBot(id: string, acciones: { id: string; etiqueta: string; payload?: Record<string, unknown> }[]): Mensaje {
  return {
    id,
    conversacionId: "fixture",
    rol: "bot",
    texto: "",
    creadoEn: "2026-11-25T00:00:00Z",
    bloques: [{ id: `b-${id}`, tipo: "ACCIONES_RAPIDAS", acciones }],
  };
}

const BOT_BIENVENIDA = mensajeBot("bot-1", [{ id: "VER_OFERTAS", etiqueta: "Ver ofertas", payload: {} }]);

function abrirChat() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ChatPage conversationId="fixture" />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  h.reload.mockResolvedValue(undefined);
  h.execute.mockResolvedValue(undefined);
  h.logout.mockResolvedValue({ ok: true });
  h.crear.mockResolvedValue({ conversacionId: "nueva" });
  h.chatState.mensajes = [BOT_BIENVENIDA];
  h.chatState.estado = "listo";
  h.chatState.historialCargado = true;
  useChatStore.setState({
    accessToken: null,
    expiraEn: null,
    cliente: null,
    accionPendiente: null,
    authOpen: false,
    authVista: "login",
  });
});

afterEach(cleanup);

describe("acciones de cliente del chat (delta M5)", () => {
  it("no ejecuta una acción de cliente al rehidratar el historial", async () => {
    h.chatState.mensajes = [mensajeBot("historial", [{ id: "CERRAR_SESION", etiqueta: "Cerrar sesión" }])];
    await act(async () => { abrirChat(); });
    expect(h.logout).not.toHaveBeenCalled();
    expect(h.push).not.toHaveBeenCalled();
  });

  it("ejecuta la acción de un turno nuevo una sola vez", async () => {
    const vista = abrirChat();
    await act(async () => { vista.rerender(<QueryClientProvider client={new QueryClient()}><ChatPage conversationId="fixture" /></QueryClientProvider>); });
    h.chatState.mensajes = [BOT_BIENVENIDA, mensajeBot("bot-2", [{ id: "CERRAR_SESION", etiqueta: "Cerrar sesión" }])];
    await act(async () => { vista.rerender(<QueryClientProvider client={new QueryClient()}><ChatPage conversationId="fixture" /></QueryClientProvider>); });
    await waitFor(() => expect(h.logout).toHaveBeenCalledTimes(1));
    await act(async () => { vista.rerender(<QueryClientProvider client={new QueryClient()}><ChatPage conversationId="fixture" /></QueryClientProvider>); });
    expect(h.logout).toHaveBeenCalledTimes(1);
    expect(h.execute).not.toHaveBeenCalled();
  });

  it("IR_A_CHECKOUT sin sesión abre el login y conserva INICIAR_CHECKOUT", async () => {
    h.chatState.mensajes = [mensajeBot("bot-1", [{ id: "IR_A_CHECKOUT", etiqueta: "Pagar", payload: {} }])];
    abrirChat();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Pagar" }));
    });
    expect(useChatStore.getState().authOpen).toBe(true);
    expect(useChatStore.getState().accionPendiente).toBe("INICIAR_CHECKOUT");
    expect(h.push).not.toHaveBeenCalled();
    expect(h.execute).not.toHaveBeenCalled();
  });

  it("IR_A_CHECKOUT con sesión navega a la sección de dirección sin crear checkout", async () => {
    useChatStore.setState({ accessToken: "jwt", expiraEn: Date.now() + 60_000 });
    h.chatState.mensajes = [mensajeBot("bot-1", [{ id: "IR_A_CHECKOUT", etiqueta: "Pagar", payload: {} }])];
    abrirChat();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Pagar" }));
    });
    expect(h.push).toHaveBeenCalledWith("/checkout#direccion");
    expect(h.execute).not.toHaveBeenCalled();
  });

  it("NUEVO_CHAT crea la conversación y navega", async () => {
    h.chatState.mensajes = [mensajeBot("bot-1", [{ id: "NUEVO_CHAT", etiqueta: "Nuevo chat", payload: {} }])];
    abrirChat();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Nuevo chat" }));
    });
    await waitFor(() => expect(h.crear).toHaveBeenCalledTimes(1));
    expect(h.push).toHaveBeenCalledWith("/chat/nueva");
  });

  it("BUSCAR_CHATS abre /buscar con payload.q", async () => {
    h.chatState.mensajes = [mensajeBot("bot-1", [{ id: "BUSCAR_CHATS", etiqueta: "Buscar chats", payload: { q: "zapatillas" } }])];
    abrirChat();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Buscar chats" }));
    });
    expect(h.push).toHaveBeenCalledWith("/buscar?q=zapatillas");
  });

  it("CERRAR_SESION reutiliza el logout de mod-auth y no llama al BFF de acciones", async () => {
    useChatStore.setState({ accessToken: "jwt", expiraEn: Date.now() + 60_000 });
    h.chatState.mensajes = [mensajeBot("bot-1", [{ id: "CERRAR_SESION", etiqueta: "Cerrar sesión", payload: {} }])];
    abrirChat();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    });
    await waitFor(() => expect(h.logout).toHaveBeenCalledTimes(1));
    expect(h.execute).not.toHaveBeenCalled();
    expect(h.reload).not.toHaveBeenCalled();
  });

  it("una acción normal sigue yendo al BFF", async () => {
    h.chatState.mensajes = [mensajeBot("bot-1", [{ id: "VER_OFERTAS", etiqueta: "Ver ofertas", payload: {} }])];
    abrirChat();
    await act(async () => {
      fireEvent.click(within(screen.getByTestId("acciones-rapidas")).getByRole("button", { name: "Ver ofertas" }));
    });
    await waitFor(() => expect(h.execute).toHaveBeenCalledWith(expect.anything(), {
      conversacionId: "fixture",
      accion: { tipo: "VER_OFERTAS", payload: {} },
    }));
  });
});
