// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { RatingPopup } from "@/modules/mod-checkout/ui/RatingPopup";

const onClose = vi.fn();
const h = vi.hoisted(() => ({ calificarCompra: vi.fn() }));

vi.mock("@/shared/di/container", () => ({
  container: { checkout: { calificarCompra: h.calificarCompra } },
}));

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  h.calificarCompra.mockResolvedValue(undefined);
});
afterEach(cleanup);

function montar() {
  return render(<RatingPopup pedidoId="PED-1" onClose={onClose} />);
}

describe("RatingPopup (SPEC-24 Req. 7)", () => {
  it("pide elegir estrellas antes de enviar", () => {
    montar();

    const enviar = screen.getByRole("button", { name: "ENVIAR CALIFICACIÓN" }) as HTMLButtonElement;
    expect(enviar.disabled).toBe(true);
    expect(screen.getByText("Toca las estrellas")).toBeDefined();
  });

  it("responde distinto según la calificación", () => {
    montar();

    fireEvent.click(screen.getByRole("radio", { name: "5 estrellas" }));
    expect(screen.getByText(/5\/5 .*Gracias/)).toBeDefined();

    fireEvent.click(screen.getByRole("radio", { name: "3 estrellas" }));
    expect(screen.getByText("3/5 Tomamos nota")).toBeDefined();

    fireEvent.click(screen.getByRole("radio", { name: "1 estrella" }));
    expect(screen.getByText(/1\/5 .*falló/)).toBeDefined();
  });

  it("resalta la estrella bajo el cursor", () => {
    montar();

    const cuarta = screen.getByRole("radio", { name: "4 estrellas" });
    fireEvent.mouseEnter(cuarta);
    expect(cuarta.className).toContain("text-action-primary");
    fireEvent.mouseLeave(cuarta);
    expect(cuarta.className).toContain("text-border-default");
  });

  it("registra la valoración en el chatbot y agradece", async () => {
    montar();

    fireEvent.click(screen.getByRole("radio", { name: "4 estrellas" }));
    fireEvent.change(screen.getByLabelText("Comentario de la compra"), {
      target: { value: "Llegó rápido" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ENVIAR CALIFICACIÓN" }));

    expect(await screen.findByText("¡GRACIAS POR TU OPINIÓN!")).toBeDefined();
    expect(h.calificarCompra).toHaveBeenCalledWith("PED-1", 4, "Llegó rápido");
    expect(screen.getByText(/4\/5 estrellas/)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "ENTENDIDO" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("trata el 409 como valoración ya registrada", async () => {
    h.calificarCompra.mockRejectedValueOnce({ response: { status: 409, data: { code: "YA_CALIFICADO" } } });
    montar();
    fireEvent.click(screen.getByRole("radio", { name: "5 estrellas" }));
    fireEvent.click(screen.getByRole("button", { name: "ENVIAR CALIFICACIÓN" }));

    expect(await screen.findByText("¡GRACIAS POR TU OPINIÓN!")).toBeDefined();
  });

  it("mantiene el popup si el guardado falla", async () => {
    h.calificarCompra.mockRejectedValueOnce(new Error("sin red"));
    montar();
    fireEvent.click(screen.getByRole("radio", { name: "3 estrellas" }));
    fireEvent.click(screen.getByRole("button", { name: "ENVIAR CALIFICACIÓN" }));

    expect(await screen.findByText("No pudimos guardar tu opinión")).toBeDefined();
    expect(screen.getByRole("button", { name: "ENVIAR CALIFICACIÓN" })).toBeDefined();
  });

  it("recuerda el descarte por pedido y no vuelve a mostrarse", () => {
    montar();
    fireEvent.click(screen.getByRole("button", { name: "Ahora no" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem("compra-calificacion-descartada:PED-1")).toBe("1");
  });
});
