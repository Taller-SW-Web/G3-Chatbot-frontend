// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SearchChatsPage } from "@/modules/mod-chat/ui/SearchChatsPage";
import { useChatStore } from "@/shared/auth/chatStore";

const h = vi.hoisted(() => ({ push: vi.fn(), buscar: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: h.push, replace: vi.fn() }) }));
vi.mock("@/shared/di/container", () => ({
  container: { chat: { buscarConversaciones: h.buscar } },
}));

beforeEach(() => {
  vi.clearAllMocks();
  h.buscar.mockResolvedValue([
    {
      id: "conv-1",
      titulo: "Zapatillas para correr",
      preview: "Vimos las Nike Revolution",
      ultimoMensajeEn: "2026-11-24T10:00:00Z",
    },
  ]);
  useChatStore.setState({ cliente: null });
});

afterEach(cleanup);

it("abre con el término de payload.q y muestra los resultados", async () => {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <SearchChatsPage qInicial="zapatillas" />
    </QueryClientProvider>
  );

  await waitFor(() => expect(h.buscar).toHaveBeenCalledWith("zapatillas", 1));
  expect(await screen.findByText("Zapatillas para correr")).toBeTruthy();
  expect(screen.getByText("Vimos las Nike Revolution")).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: /Zapatillas para correr/ }));
  expect(h.push).toHaveBeenCalledWith("/chat/conv-1");
});

it("sin término no consulta y pide escribir uno", () => {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <SearchChatsPage />
    </QueryClientProvider>
  );

  expect(screen.getByText("Escribe un término para buscar en tus conversaciones.")).toBeTruthy();
  expect(h.buscar).not.toHaveBeenCalled();
});
