// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BotFeedback } from "@/modules/mod-chat/ui/BotFeedback";

const h = vi.hoisted(() => ({ enviarReaccion: vi.fn() }));
vi.mock("@/shared/di/container", () => ({
  container: { chat: { enviarReaccion: h.enviarReaccion } },
}));

beforeEach(() => {
  vi.clearAllMocks();
  h.enviarReaccion.mockResolvedValue(undefined);
});
afterEach(cleanup);

describe("BotFeedback (SPEC-24 Req. 1)", () => {
  it("marca la reacción de forma optimista y la registra", async () => {
    render(<BotFeedback text="Hola" mensajeId="m-1" />);

    const up = screen.getByRole("button", { name: "Me sirvió" });
    fireEvent.click(up);

    expect(up.getAttribute("aria-pressed")).toBe("true");
    await waitFor(() => expect(h.enviarReaccion).toHaveBeenCalledWith("m-1", "POSITIVE"));
  });

  it("cambia de 👍 a 👎 sin acumular ambas", async () => {
    render(<BotFeedback text="Hola" mensajeId="m-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Me sirvió" }));
    fireEvent.click(screen.getByRole("button", { name: "No me sirvió" }));

    expect(screen.getByRole("button", { name: "No me sirvió" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Me sirvió" }).getAttribute("aria-pressed")).toBe("false");
    await waitFor(() => expect(h.enviarReaccion).toHaveBeenLastCalledWith("m-1", "NEGATIVE"));
  });

  it("no bloquea el chat si el registro falla", async () => {
    h.enviarReaccion.mockRejectedValue(new Error("sin red"));
    render(<BotFeedback text="Hola" mensajeId="m-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Me sirvió" }));

    expect(screen.getByRole("button", { name: "Me sirvió" }).getAttribute("aria-pressed")).toBe("true");
    await waitFor(() => expect(h.enviarReaccion).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("copia el texto al portapapeles y lo confirma sin llamar al backend", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<BotFeedback text="Texto plano" mensajeId="m-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Copiar respuesta" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith("Texto plano"));
    expect(screen.getByText("¡Copiado!")).toBeDefined();
    expect(h.enviarReaccion).not.toHaveBeenCalled();
  });
});
