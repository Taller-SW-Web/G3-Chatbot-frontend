// @vitest-environment jsdom
/** ConfirmacionPedido + "Reenviar correo" (SPEC-16 Req. 3).
 *
 * SPEC-16 · Req. 3 · Scenario: Confirmación en el chat sin correo
 * SPEC-16 · Req. 3 · Scenario: El cliente pide reenviar el correo
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ConfirmacionPedido } from "@/adapters/inbound/components/blocks/ConfirmacionPedido";
import { avisoConfirmacion, correoParaChat } from "@/domain/utils/confirmacionCorreo";

const h = vi.hoisted(() => ({ reenviar: vi.fn() }));

vi.mock("@/infrastructure/di/container", () => ({
  container: { api: { reenviarConfirmacion: h.reenviar } },
}));

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function problema(status: number, code: string) {
  return { response: { status, data: { code } } };
}

function renderBloque(correo = "m***a@ejemplo.com") {
  render(<ConfirmacionPedido pedidoId="PED-2026-00891" correoEnmascarado={correo} />);
  return screen.getByRole("button", { name: /reenviar correo/i });
}

beforeEach(() => h.reenviar.mockReset());
afterEach(cleanup);

describe("aviso del correo enmascarado", () => {
  it("dice que se enviará, con la parte local enmascarada y el dominio oculto", () => {
    renderBloque();
    expect(screen.getByText("Te enviaremos la confirmación a m***a@….")).toBeTruthy();
    expect(screen.queryByText(/ejemplo\.com/)).toBeNull();
    expect(screen.queryByText(/enviada a/i)).toBeNull();
  });

  it("nunca muestra un correo completo aunque llegue sin máscara", () => {
    renderBloque("maria@ejemplo.com");
    expect(screen.getByText("Te enviaremos la confirmación a m***a@….")).toBeTruthy();
    expect(document.body.textContent).not.toContain("maria");
  });

  it("formatea igual para el chat", () => {
    expect(avisoConfirmacion("j***z@example.com")).toBe("Te enviaremos la confirmación a j***z@…");
    expect(correoParaChat("ab@x.pe")).toBe("**@…");
  });
});

describe("Reenviar correo", () => {
  it("en 202 confirma y anuncia los reenvíos restantes", async () => {
    h.reenviar.mockResolvedValueOnce({
      ok: true, pedidoId: "PED-2026-00891", reenviosRestantes: 1, correoEnmascarado: "m***a@ejemplo.com",
    });
    const boton = renderBloque();

    fireEvent.click(boton);

    const estado = screen.getByRole("status");
    await waitFor(() => expect(estado.querySelectorAll("span")).toHaveLength(2));
    // Each sentence on its own line, inside the same live region.
    expect([...estado.querySelectorAll("span")].map((s) => s.textContent)).toEqual([
      "Listo, reenviamos la confirmación a m***a@….",
      "Te queda 1 reenvío.",
    ]);
    expect(estado.getAttribute("aria-live")).toBe("polite");
    expect(h.reenviar).toHaveBeenCalledWith("PED-2026-00891", expect.stringMatching(UUID));
    expect((boton as HTMLButtonElement).disabled).toBe(false);
  });

  it("sin reenvíos restantes deshabilita el botón", async () => {
    h.reenviar.mockResolvedValueOnce({
      ok: true, pedidoId: "PED-2026-00891", reenviosRestantes: 0, correoEnmascarado: "m***a@ejemplo.com",
    });
    const boton = renderBloque();

    fireEvent.click(boton);

    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Ya no quedan reenvíos"));
    expect((boton as HTMLButtonElement).disabled).toBe(true);
  });

  it("en 429 LIMITE_REENVIOS_EXCEDIDO deshabilita el botón con un mensaje claro", async () => {
    h.reenviar.mockRejectedValueOnce(problema(429, "LIMITE_REENVIOS_EXCEDIDO"));
    const boton = renderBloque();

    fireEvent.click(boton);

    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("2 veces, el máximo"));
    expect(screen.getByRole("status").textContent).toContain("spam");
    expect((boton as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(boton);
    expect(h.reenviar).toHaveBeenCalledTimes(1);
  });

  it("un error de red se informa y se puede reintentar con otra clave", async () => {
    h.reenviar
      .mockRejectedValueOnce(new Error("Network Error"))
      .mockResolvedValueOnce({
        ok: true, pedidoId: "PED-2026-00891", reenviosRestantes: 1, correoEnmascarado: "m***a@ejemplo.com",
      });
    const boton = renderBloque();

    fireEvent.click(boton);
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Revisa tu conexión"));
    expect((boton as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(boton);
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Te queda 1 reenvío"));
    const [primera, segunda] = h.reenviar.mock.calls.map((c) => c[1]);
    expect(primera).not.toBe(segunda);
  });

  it("bloquea el doble clic mientras se envía", async () => {
    let resolver: (v: unknown) => void = () => {};
    h.reenviar.mockReturnValueOnce(new Promise((r) => (resolver = r)));
    const boton = renderBloque();

    fireEvent.click(boton);
    fireEvent.click(boton);

    expect(h.reenviar).toHaveBeenCalledTimes(1);
    expect(boton.textContent).toBe("Reenviando…");
    expect(boton.getAttribute("aria-busy")).toBe("true");
    expect((boton as HTMLButtonElement).disabled).toBe(true);

    resolver({ ok: true, pedidoId: "PED-2026-00891", reenviosRestantes: 1, correoEnmascarado: "m***a@ejemplo.com" });
    await waitFor(() => expect(boton.textContent).toBe("Reenviar correo"));
  });

  it("es un botón nativo, manejable con teclado", () => {
    const boton = renderBloque();
    expect(boton.tagName).toBe("BUTTON");
    expect(boton.getAttribute("type")).toBe("button");
  });
});
