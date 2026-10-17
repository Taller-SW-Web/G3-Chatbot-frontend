import { beforeEach, describe, expect, it } from "vitest";
import { useChatStore } from "@/application/state/chatStore";

function reset() {
  useChatStore.setState({
    accessToken: null,
    expiraEn: null,
    cliente: null,
    mensajes: [],
    accionPendiente: null,
    mensajePendiente: null,
  });
}

describe("chatStore session (SPEC-03)", () => {
  beforeEach(reset);

  it("applySession stores the token and its expiry", () => {
    const before = Date.now();
    useChatStore.getState().applySession("token-1", 900);
    const s = useChatStore.getState();
    expect(s.accessToken).toBe("token-1");
    expect(s.expiraEn).toBeGreaterThanOrEqual(before + 900 * 1000);
  });

  it("isTokenExpiringSoon is true inside the refresh margin", () => {
    useChatStore.getState().applySession("token-1", 30);
    expect(useChatStore.getState().isTokenExpiringSoon()).toBe(true);
  });

  it("isTokenExpiringSoon is false without a token", () => {
    expect(useChatStore.getState().isTokenExpiringSoon()).toBe(false);
  });

  it("logout clears the session and pending data", () => {
    const s = useChatStore.getState();
    s.applySession("token-1", 900);
    s.setCliente({ nombreCompleto: "Ana", correo: "a@b.pe", celularVerificado: true });
    s.setAccionPendiente("/checkout");
    s.setMensajePendiente({ bot: "Hola" });

    useChatStore.getState().logout();

    const after = useChatStore.getState();
    expect(after.accessToken).toBeNull();
    expect(after.cliente).toBeNull();
    expect(after.accionPendiente).toBeNull();
    expect(after.mensajePendiente).toBeNull();
  });
});
