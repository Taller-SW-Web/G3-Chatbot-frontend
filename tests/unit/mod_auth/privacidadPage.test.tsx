// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { PrivacidadPage } from "@/modules/mod-auth/ui/PrivacidadPage";

const back = vi.hoisted(() => vi.fn());
const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  useRouter: () => ({ back, push }),
}));

afterEach(() => {
  cleanup();
  Object.defineProperty(window.history, "length", { value: 1, configurable: true, writable: true });
});

describe("PrivacidadPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window.history, "length", { value: 1, configurable: true, writable: true });
  });

  it("renderiza el título y las secciones normativas de privacidad", () => {
    render(<PrivacidadPage />);

    expect(screen.getByText("POLÍTICA DE PRIVACIDAD")).toBeDefined();
    expect(screen.getAllByText(/Inka Athletics/).length).toBeGreaterThan(0);
    expect(screen.getByText(/1\. Marco Normativo y Finalidad/)).toBeDefined();
    expect(screen.getByText(/2\. Asistente con Inteligencia Artificial/)).toBeDefined();
    expect(screen.getByText(/5\. Derechos ARCO/)).toBeDefined();
  });

  it("en carga directa o pestaña nueva (sin historial, length <= 1), el botón volver redirige a '/'", () => {
    render(<PrivacidadPage />);

    const volverButtons = screen.getAllByRole("button", { name: /volver/i });
    expect(volverButtons.length).toBe(2);

    fireEvent.click(volverButtons[0]);
    expect(push).toHaveBeenCalledWith("/");
    expect(back).not.toHaveBeenCalled();

    fireEvent.click(volverButtons[1]);
    expect(push).toHaveBeenCalledWith("/");
  });

  it("cuando existe historial en la sesión (length > 1), el botón volver regresa con back()", () => {
    Object.defineProperty(window.history, "length", { value: 2, configurable: true, writable: true });
    render(<PrivacidadPage />);

    const volverButtons = screen.getAllByRole("button", { name: /volver/i });
    expect(volverButtons.length).toBe(2);

    fireEvent.click(volverButtons[0]);
    expect(back).toHaveBeenCalledTimes(1);
    expect(push).not.toHaveBeenCalled();

    fireEvent.click(volverButtons[1]);
    expect(back).toHaveBeenCalledTimes(2);
  });
});
