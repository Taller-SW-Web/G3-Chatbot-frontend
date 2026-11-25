// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CarritoChat } from "@/modules/mod-chat/ui/blocks/BloquesContenedores";
import { useChatStore } from "@/shared/auth/chatStore";

const nav = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: nav.push }),
}));

const DATOS = {
  lineas: [
    {
      item_id: "l1",
      sku: "SKU-1",
      nombre: "Zapatilla",
      cantidad: 1,
      precio: 100,
      disponible: true,
    },
  ],
  subtotal: 100,
  total: 100,
  avisos: [],
};

describe("CarritoChat: pagar no exige celular verificado", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useChatStore.setState({ cliente: null, accionPendiente: null, authOpen: false });
  });

  afterEach(cleanup);

  it("con cliente y celular sin verificar navega directo a /checkout", () => {
    useChatStore.setState({
      cliente: {
        id: "cli-1",
        nombreCompleto: "Ana Díaz",
        correo: "ana@test.pe",
        celularVerificado: false,
      },
    });
    render(<CarritoChat datos={DATOS} />);

    fireEvent.click(screen.getByTestId("btn-pagar"));

    expect(nav.push).toHaveBeenCalledWith("/checkout");
    expect(nav.push).not.toHaveBeenCalledWith("/cuenta");
    expect(useChatStore.getState().authOpen).toBe(false);
  });

  it("sin cliente abre el auth y recuerda el destino", () => {
    render(<CarritoChat datos={DATOS} />);

    fireEvent.click(screen.getByTestId("btn-pagar"));

    expect(nav.push).not.toHaveBeenCalled();
    expect(useChatStore.getState().authOpen).toBe(true);
    expect(useChatStore.getState().accionPendiente).toBe("/checkout");
  });
});
