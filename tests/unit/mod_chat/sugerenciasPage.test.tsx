// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { SugerenciasPage } from "@/modules/mod-chat/ui/SugerenciasPage";
import SugerenciasRoute from "@/app/sugerencias/page";
import { useChatStore } from "@/shared/auth/chatStore";

const h = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: h.push, replace: h.replace }),
  usePathname: () => "/sugerencias",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/shared/ui/shell/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/shared/di/container", () => ({
  container: { chat: { enviarSugerencia: vi.fn() }, api: { refreshSession: h.refresh } },
}));

beforeEach(() => {
  vi.clearAllMocks();
  h.refresh.mockRejectedValue(new Error("sin sesión"));
  useChatStore.setState({ cliente: null, accessToken: null, expiraEn: null, authOpen: false, accionPendiente: null });
});
afterEach(cleanup);

describe("/sugerencias (SPEC-24 Req. 3)", () => {
  it("sin sesión no muestra el formulario y lleva al login", async () => {
    render(<SugerenciasRoute />);

    expect(screen.queryByLabelText(/Correo/)).toBeNull();
    await vi.waitFor(() => expect(h.replace).toHaveBeenCalledWith("/?abrirLogin=1"));
    expect(useChatStore.getState().accionPendiente).toBe("/sugerencias");
    expect(useChatStore.getState().authOpen).toBe(true);
  });

  it("no rellena un correo de demostración", () => {
    render(<SugerenciasPage />);

    expect(document.body.innerHTML).not.toContain("cliente.demo@correo.com");
  });
});
