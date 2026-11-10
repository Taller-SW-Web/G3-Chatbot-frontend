// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { RatingPopup } from "@/adapters/inbound/components/RatingPopup";

const onClose = vi.fn();

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("RatingPopup", () => {
  it("pide elegir estrellas antes de enviar", () => {
    render(<RatingPopup onClose={onClose} />);

    const enviar = screen.getByRole("button", { name: "ENVIAR CALIFICACIÓN" }) as HTMLButtonElement;
    expect(enviar.disabled).toBe(true);
    expect(screen.getByText("Toca las estrellas")).toBeDefined();
  });

  it("responde distinto según la calificación", () => {
    render(<RatingPopup onClose={onClose} />);

    fireEvent.click(screen.getByRole("radio", { name: "5 estrellas" }));
    expect(screen.getByText(/5\/5 .*Gracias/)).toBeDefined();

    fireEvent.click(screen.getByRole("radio", { name: "3 estrellas" }));
    expect(screen.getByText("3/5 Tomamos nota")).toBeDefined();

    fireEvent.click(screen.getByRole("radio", { name: "1 estrella" }));
    expect(screen.getByText(/1\/5 .*falló/)).toBeDefined();
  });

  it("resalta la estrella bajo el cursor", () => {
    render(<RatingPopup onClose={onClose} />);

    const cuarta = screen.getByRole("radio", { name: "4 estrellas" });
    fireEvent.mouseEnter(cuarta);
    expect(cuarta.className).toContain("text-action-primary");
    fireEvent.mouseLeave(cuarta);
    expect(cuarta.className).toContain("text-border-default");
  });

  it("registra la calificación y agradece", () => {
    render(<RatingPopup onClose={onClose} />);

    fireEvent.click(screen.getByRole("radio", { name: "4 estrellas" }));
    fireEvent.change(screen.getByLabelText("Comentario de la compra"), {
      target: { value: "Llegó rápido" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ENVIAR CALIFICACIÓN" }));

    expect(screen.getByText("¡GRACIAS POR TU OPINIÓN!")).toBeDefined();
    expect(screen.getByText(/4\/5 estrellas/)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "ENTENDIDO" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("permite posponer la calificación", () => {
    render(<RatingPopup onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Ahora no" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
