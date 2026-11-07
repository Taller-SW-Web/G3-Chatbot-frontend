// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChatPage } from "@/adapters/inbound/pages/ChatPage";

const h = vi.hoisted(() => ({ execute: vi.fn(), reload: vi.fn(), send: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/infrastructure/di/container", () => ({ container: { api: {} } }));
vi.mock("@/application/use_cases/ejecutarAccionChatUseCase", () => ({ ejecutarAccionChatUseCase: h.execute }));
vi.mock("@/adapters/inbound/hooks/useChat", () => ({
  useChat: () => ({
    mensajes: [{ id: "fixture-bot", conversacionId: "fixture", rol: "bot", texto: "", creadoEn: "2026-11-05T00:00:00Z", bloques: [{ tipo: "ACCIONES_RAPIDAS", acciones: [
      { id: "RECOMENDAR_PRODUCTOS", etiqueta: "Asfalto", payload: { actividad: "running", superficie: "asfalto" } },
      { id: "VER_OFERTAS", etiqueta: "Consultar ofertas", payload: {} },
    ] }] }],
    borrador: null, estado: "listo", error: null, incompleto: false, historialCargado: true,
    ultimoTexto: "", enviar: h.send, reintentar: vi.fn(), recargar: vi.fn(), recargarSilencioso: h.reload,
  }),
}));

function openChat() {
  return render(<QueryClientProvider client={new QueryClient()}><ChatPage conversationId="fixture" /></QueryClientProvider>);
}
beforeEach(() => { vi.clearAllMocks(); h.reload.mockResolvedValue(undefined); });
afterEach(cleanup);

it("announces a known recommendation action until the refreshed history finishes", async () => {
  let finish!: () => void;
  let refresh!: () => void;
  const pending = new Promise<void>((resolve) => { finish = resolve; });
  const reloading = new Promise<void>((resolve) => { refresh = resolve; });
  h.execute.mockReturnValue(pending);
  h.reload.mockReturnValue(reloading);
  openChat();
  fireEvent.click(screen.getByRole("button", { name: "Asfalto" }));
  expect(screen.getByRole("status").textContent).toBe("Buscando opciones para ti…");
  expect(screen.queryByText(/Las acciones no están disponibles/)).toBeNull();
  expect((screen.getByRole("button", { name: "Asfalto" }) as HTMLButtonElement).disabled).toBe(true);
  expect(h.execute).toHaveBeenCalledWith(expect.anything(), { conversacionId: "fixture", accion: { tipo: "RECOMENDAR_PRODUCTOS", payload: { actividad: "running", superficie: "asfalto" } } });
  await act(async () => { finish(); await pending; });
  expect(screen.getByText("Buscando opciones para ti…")).toBeTruthy();
  await act(async () => { refresh(); await reloading; });
  expect(screen.queryByText("Buscando opciones para ti…")).toBeNull();
});

it("clears recommendation feedback after a failed request and permits retry", async () => {
  let reject!: () => void;
  const pending = new Promise<void>((_resolve, fail) => { reject = () => fail(new Error("fixture failure")); });
  h.execute.mockReturnValue(pending);
  openChat();
  fireEvent.click(screen.getByRole("button", { name: "Asfalto" }));
  expect(screen.getByText("Buscando opciones para ti…")).toBeTruthy();
  await act(async () => { reject(); await pending.catch(() => {}); });
  expect(screen.queryByText("Buscando opciones para ti…")).toBeNull();
  expect(screen.getByRole("alert")).toBeTruthy();
  expect((screen.getByRole("button", { name: "Asfalto" }) as HTMLButtonElement).disabled).toBe(false);
});

it("does not infer recommendation intent from another action or natural-language text", async () => {
  let finish!: () => void;
  const pending = new Promise<void>((resolve) => { finish = resolve; });
  h.execute.mockReturnValue(pending);
  openChat();
  fireEvent.click(screen.getByRole("button", { name: "Consultar ofertas" }));
  expect(screen.queryByText("Buscando opciones para ti…")).toBeNull();
  expect(screen.queryByText(/Las acciones no están disponibles/)).toBeNull();
  await act(async () => { finish(); await pending; });
  fireEvent.change(screen.getByLabelText("Mensaje"), { target: { value: "Recomiéndame zapatillas" } });
  fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
  expect(h.send).toHaveBeenCalledWith("Recomiéndame zapatillas");
  expect(screen.queryByText("Buscando opciones para ti…")).toBeNull();
});
