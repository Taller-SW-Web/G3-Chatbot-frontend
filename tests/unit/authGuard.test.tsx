// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { createElement } from "react";
import { AuthGuard } from "@/adapters/inbound/components/AuthGuard";
import { useChatStore } from "@/application/state/chatStore";
import { SESION_COOKIE_NAME, sincronizarCookieSesion } from "@/domain/utils/sesion";

const navMock = vi.hoisted(() => ({
  replace: vi.fn(),
  push: vi.fn(),
  pathname: "/cuenta",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: navMock.replace,
    push: navMock.push,
  }),
  usePathname: () => navMock.pathname,
}));

function resetStore() {
  useChatStore.setState({
    accessToken: null,
    expiraEn: null,
    cliente: null,
    accionPendiente: null,
    authOpen: false,
  });
  navMock.replace.mockClear();
  navMock.push.mockClear();
  navMock.pathname = "/cuenta";
  sincronizarCookieSesion(false);
}

describe("AuthGuard (H4-S5)", () => {
  beforeEach(resetStore);
  afterEach(cleanup);

  it("permite renderizar el contenido protegido si el usuario tiene sesión activa", async () => {
    useChatStore.getState().applySession("jwt-valido-123", 900, {
      id: "cli-1",
      nombreCompleto: "Diego Dev",
      correo: "diego@ejemplo.pe",
      celularVerificado: true,
    });

    render(
      createElement(
        AuthGuard,
        null,
        createElement("div", { "data-testid": "contenido-privado" }, "Pantalla privada")
      )
    );

    expect(await screen.findByTestId("contenido-privado")).toBeDefined();
    expect(screen.getByText("Pantalla privada")).toBeDefined();
    expect(navMock.replace).not.toHaveBeenCalled();
    expect(useChatStore.getState().authOpen).toBe(false);
  });

  it("bloquea el contenido y redirige al login si no hay token de sesión", async () => {
    navMock.pathname = "/checkout";

    render(
      createElement(
        AuthGuard,
        null,
        createElement("div", { "data-testid": "contenido-privado" }, "No visible")
      )
    );

    expect(screen.queryByTestId("contenido-privado")).toBeNull();
    expect(screen.getByTestId("auth-guard-loading")).toBeDefined();

    await waitFor(() => {
      expect(navMock.replace).toHaveBeenCalledWith("/?abrirLogin=1");
    });

    const store = useChatStore.getState();
    expect(store.authOpen).toBe(true);
    expect(store.accionPendiente).toBe("/checkout");
  });

  it("respeta rutas con parámetros y destinos personalizados", async () => {
    navMock.pathname = "/pedidos/reclamos";

    render(
      createElement(
        AuthGuard,
        { redirectTo: "/?abrirLogin=1&origen=pedidos" },
        createElement("div", null, "Privado")
      )
    );

    await waitFor(() => {
      expect(navMock.replace).toHaveBeenCalledWith("/?abrirLogin=1&origen=pedidos");
    });

    expect(useChatStore.getState().accionPendiente).toBe("/pedidos/reclamos");
    expect(useChatStore.getState().authOpen).toBe(true);
  });

  it("sincroniza la cookie indicadora de sesión en applySession y la limpia en logout", () => {
    expect(document.cookie).not.toContain(`${SESION_COOKIE_NAME}=1`);

    useChatStore.getState().applySession("jwt-token", 900);
    expect(document.cookie).toContain(`${SESION_COOKIE_NAME}=1`);

    useChatStore.getState().logout();
    expect(document.cookie).not.toContain(`${SESION_COOKIE_NAME}=1`);
  });

  it("bloquea el acceso y redirige si el token ya venció (PR #33 alto 5)", async () => {
    // Token vencido hace 5 segundos
    useChatStore.setState({
      accessToken: "token-expirado",
      expiraEn: Date.now() - 5000,
    });
    navMock.pathname = "/cuenta";

    render(
      createElement(
        AuthGuard,
        null,
        createElement("div", { "data-testid": "contenido-privado" }, "No debe verse")
      )
    );

    expect(screen.queryByTestId("contenido-privado")).toBeNull();
    await waitFor(() => {
      expect(navMock.replace).toHaveBeenCalledWith("/?abrirLogin=1");
    });
  });
});
