// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { OtpCelularFlow } from "@/shared/auth/OtpCelularFlow";
import { useChatStore } from "@/shared/auth/chatStore";

const api = vi.hoisted(() => ({
  solicitarOtpCelular: vi.fn(),
  verificarOtpCelular: vi.fn(),
}));

vi.mock("@/shared/di/container", () => ({ container: { auth: api } }));

beforeEach(() => {
  vi.clearAllMocks();
  useChatStore.setState({
    cliente: {
      id: "u1",
      correo: "ana@ejemplo.pe",
      celular: "987654321",
      celularEnmascarado: "+51 9****4321",
      celularVerificado: false,
    } as never,
  });
  api.solicitarOtpCelular.mockResolvedValue({
    ok: true,
    celularEnmascarado: "+51 9****4321",
    expiraEnSegundos: 300,
  });
  api.verificarOtpCelular.mockResolvedValue({ verificado: true });
});

afterEach(cleanup);

describe("OtpCelularFlow (SPEC-04)", () => {
  it("solicita el código y reutiliza OtpInput para verificarlo", async () => {
    const onVerificado = vi.fn();
    render(<OtpCelularFlow onVerificado={onVerificado} />);

    expect(screen.getByText(/Para coordinar la entrega necesitamos confirmar tu celular/)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "ENVIAR CÓDIGO" }));

    await waitFor(() => expect(api.solicitarOtpCelular).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Ingresa el código de 6 dígitos")).toBeDefined();
    expect(screen.getByText(/Vigente 05:00/)).toBeDefined();

    const input = screen.getByLabelText("Código de verificación");
    expect(input.getAttribute("inputmode")).toBe("numeric");
    expect(input.getAttribute("maxlength")).toBe("6");

    fireEvent.change(input, { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "VERIFICAR" }));

    await waitFor(() => expect(api.verificarOtpCelular).toHaveBeenCalledWith("123456"));
    expect(onVerificado).toHaveBeenCalledWith({ verificado: true });
    expect(await screen.findByTestId("otp-verificado")).toBeDefined();
    expect(screen.getByText("¡Listo! Tu celular quedó verificado.")).toBeDefined();
  });

  it("valida en el cliente que el código tenga 6 dígitos", async () => {
    render(<OtpCelularFlow onVerificado={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "ENVIAR CÓDIGO" }));
    await screen.findByText("Ingresa el código de 6 dígitos");

    fireEvent.change(screen.getByLabelText("Código de verificación"), { target: { value: "12" } });
    fireEvent.click(screen.getByRole("button", { name: "VERIFICAR" }));

    expect(screen.getAllByText("Ingresa el código de 6 dígitos.").length).toBeGreaterThan(0);
    expect(api.verificarOtpCelular).not.toHaveBeenCalled();
  });

  it("traduce CODIGO_INCORRECTO con los intentos restantes", async () => {
    api.verificarOtpCelular.mockRejectedValue({
      response: { status: 400, data: { code: "CODIGO_INCORRECTO", intentosRestantes: 2 } },
    });
    render(<OtpCelularFlow onVerificado={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "ENVIAR CÓDIGO" }));
    await screen.findByText("Ingresa el código de 6 dígitos");

    fireEvent.change(screen.getByLabelText("Código de verificación"), { target: { value: "000000" } });
    fireEvent.click(screen.getByRole("button", { name: "VERIFICAR" }));

    expect(await screen.findByText("Código incorrecto. Te quedan 2 intentos.")).toBeDefined();
    expect(screen.queryByTestId("otp-verificado")).toBeNull();
  });

  it("muestra el límite de reenvíos y pide esperar", async () => {
    api.solicitarOtpCelular.mockRejectedValue({
      response: { status: 429, data: { code: "LIMITE_ENVIOS", esperaSegundos: 90 } },
    });
    render(<OtpCelularFlow onVerificado={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "ENVIAR CÓDIGO" }));

    expect(await screen.findByText("Espera unos minutos antes de pedir otro código.")).toBeDefined();
    expect(screen.getByRole("button", { name: "ENVIAR CÓDIGO" })).toBeDefined();
  });

  it("explica que el cambio de número se hace en el perfil", async () => {
    render(<OtpCelularFlow onVerificado={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Ese no es mi número" }));
    expect(screen.getByText(/El cambio de celular se hace desde tu perfil de cuenta/)).toBeDefined();
  });
});
