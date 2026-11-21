// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MessageBubble } from "@/modules/mod-chat/ui/MessageBubble";
import { useChatStore } from "@/shared/auth/chatStore";

const h = vi.hoisted(() => ({
  push: vi.fn(),
  solicitar: vi.fn(),
  verificar: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: h.push }) }));
vi.mock("@/shared/di/container", () => ({
  container: { auth: { solicitarOtpCelular: h.solicitar, verificarOtpCelular: h.verificar } },
}));

beforeEach(() => {
  vi.clearAllMocks();
  useChatStore.setState({
    cliente: {
      id: "u1",
      correo: "ana@ejemplo.pe",
      celularVerificado: false,
      celularEnmascarado: "+51 9****4321",
    } as never,
    accionPendiente: "INICIAR_CHECKOUT",
  });
  h.solicitar.mockResolvedValue({
    enviado: true,
    celularEnmascarado: "+51 9****4321",
    expiraEn: new Date(Date.now() + 300_000).toISOString(),
  });
  h.verificar.mockResolvedValue({
    celularVerificado: true,
    celularEnmascarado: "+51 9****4321",
  });
});
afterEach(cleanup);

describe("bloque FORMULARIO/OTP_CELULAR (SPEC-04)", () => {
  it("reutiliza OtpCelularFlow y ejecuta la accionPendiente al verificar", async () => {
    render(
      <MessageBubble
        rol="bot"
        texto="Para coordinar la entrega necesitamos confirmar tu celular."
        bloques={[
          {
            id: "otp-1",
            tipo: "FORMULARIO",
            formulario: "OTP_CELULAR",
            celularEnmascarado: "+51 9****4321",
          },
        ]}
      />
    );

    expect(screen.getByTestId("bloque-otp-celular")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "ENVIAR CÓDIGO" }));
    expect(await screen.findByText("Ingresa el código de 6 dígitos")).toBeDefined();

    fireEvent.change(screen.getByLabelText("Código de verificación"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "VERIFICAR" }));

    await waitFor(() => expect(h.push).toHaveBeenCalledWith("/checkout"));
    expect(useChatStore.getState().cliente?.celularVerificado).toBe(true);
    expect(useChatStore.getState().accionPendiente).toBeNull();
  });
});
