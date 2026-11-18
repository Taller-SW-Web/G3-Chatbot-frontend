// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { VerificarCorreoPage } from "@/adapters/inbound/pages/VerificarCorreoPage";
import { useChatStore } from "@/application/state/chatStore";

const api = vi.hoisted(() => ({
  verificarCorreo: vi.fn(),
  reenviarVerificacion: vi.fn(),
}));

vi.mock("@/infrastructure/di/container", () => ({ container: { api } }));

function errorCon(code: string, status: number) {
  return { response: { status, data: { code } } };
}

function reenviar(correo = "ana@ejemplo.pe") {
  fireEvent.change(screen.getByLabelText("Correo"), { target: { value: correo } });
  fireEvent.click(screen.getByRole("button", { name: "ENVIARME UN ENLACE NUEVO" }));
}

beforeEach(() => {
  vi.clearAllMocks();
  useChatStore.setState({ authOpen: false });
  window.history.replaceState(null, "", "/verificar-correo");
  api.verificarCorreo.mockResolvedValue(undefined);
  api.reenviarVerificacion.mockResolvedValue({ ok: true });
});

afterEach(cleanup);

describe("VerificarCorreoPage", () => {
  it("sin token avisa que el enlace es inválido y ofrece reenviar", () => {
    render(<VerificarCorreoPage />);

    expect(screen.getByText("Enlace inválido")).toBeDefined();
    expect(screen.getByRole("button", { name: "ENVIARME UN ENLACE NUEVO" })).toBeDefined();
    expect(api.verificarCorreo).not.toHaveBeenCalled();
  });

  it("canjea el token, limpia la URL y deja entrar", async () => {
    window.history.replaceState(null, "", "/verificar-correo?token=abc");
    render(<VerificarCorreoPage token="abc" />);

    expect(screen.getByText(/Verificando tu correo/)).toBeDefined();
    expect(await screen.findByText("¡TU CUENTA ESTÁ ACTIVA!")).toBeDefined();
    expect(api.verificarCorreo).toHaveBeenCalledWith("abc");
    expect(window.location.pathname).toBe("/verificar-correo");
    expect(window.location.search).toBe("");

    fireEvent.click(screen.getByRole("button", { name: "INICIAR SESIÓN" }));
    expect(useChatStore.getState().authOpen).toBe(true);
  });

  it("canjea el token una sola vez aunque se vuelva a renderizar", async () => {
    const { rerender } = render(<VerificarCorreoPage token="abc" />);
    await screen.findByText("¡TU CUENTA ESTÁ ACTIVA!");

    rerender(<VerificarCorreoPage token="abc" />);
    expect(api.verificarCorreo).toHaveBeenCalledTimes(1);
  });

  it("muestra el enlace vencido y permite pedir uno nuevo", async () => {
    api.verificarCorreo.mockRejectedValue(errorCon("ENLACE_EXPIRADO", 410));
    render(<VerificarCorreoPage token="viejo" />);

    expect(await screen.findByText("Este enlace venció")).toBeDefined();
    reenviar();

    await waitFor(() => expect(api.reenviarVerificacion).toHaveBeenCalledWith("ana@ejemplo.pe"));
    expect(await screen.findByText(/Si hay una cuenta pendiente con ese correo/)).toBeDefined();
  });

  it("en una cuenta ya verificada no ofrece reenviar", async () => {
    api.verificarCorreo.mockRejectedValue(errorCon("ENLACE_YA_USADO", 409));
    render(<VerificarCorreoPage token="usado" />);

    expect(await screen.findByText("Tu cuenta ya fue verificada")).toBeDefined();
    expect(screen.queryByRole("button", { name: "ENVIARME UN ENLACE NUEVO" })).toBeNull();

    fireEvent.click(screen.getByText("Ir a iniciar sesión"));
    expect(useChatStore.getState().authOpen).toBe(true);
  });

  it("trata cualquier otro fallo como error genérico", async () => {
    api.verificarCorreo.mockRejectedValue(new Error("sin red"));
    render(<VerificarCorreoPage token="roto" />);

    expect(await screen.findByText("No pudimos verificar tu cuenta")).toBeDefined();
  });

  it("informa el fallo del reenvío sin revelar si la cuenta existe", async () => {
    api.verificarCorreo.mockRejectedValue(errorCon("ENLACE_EXPIRADO", 410));
    api.reenviarVerificacion.mockRejectedValue(errorCon("LIMITE_REENVIOS", 429));
    render(<VerificarCorreoPage token="viejo" />);

    await screen.findByText("Este enlace venció");
    reenviar();

    expect(await screen.findByText(/Ya enviamos varios enlaces/)).toBeDefined();
  });
});
