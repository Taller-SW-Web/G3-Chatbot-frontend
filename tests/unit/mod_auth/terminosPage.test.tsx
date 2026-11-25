// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { TerminosPage } from "@/modules/mod-auth/ui/TerminosPage";
import PrivacidadRoute from "@/app/privacidad/page";

const back = vi.hoisted(() => vi.fn());
const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  useRouter: () => ({ back, push }),
}));

afterEach(() => {
  cleanup();
  Object.defineProperty(window.history, "length", { value: 1, configurable: true, writable: true });
});

describe("TerminosPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window.history, "length", { value: 1, configurable: true, writable: true });
  });

  it("renderiza el título y los términos principales con enlace válido a /privacidad", () => {
    render(<TerminosPage />);

    expect(screen.getByText("TÉRMINOS Y CONDICIONES")).toBeDefined();
    expect(screen.getAllByText(/Inka Athletics/).length).toBeGreaterThan(0);
    expect(screen.getByText(/1\. Ámbito y Uso del Canal/)).toBeDefined();
    expect(screen.getByText(/2\. Asistente Virtual y Seguridad de Datos/)).toBeDefined();

    const linkPrivacidad = screen.getByRole("link", { name: /política de privacidad/i });
    expect(linkPrivacidad).toBeDefined();
    expect(linkPrivacidad.getAttribute("href")).toBe("/privacidad");
  });

  it("la ruta /privacidad está definida y resuelve el componente PrivacidadRoute", () => {
    expect(PrivacidadRoute).toBeDefined();
    render(<PrivacidadRoute />);
    expect(screen.getByText("POLÍTICA DE PRIVACIDAD")).toBeDefined();
  });

  it("en carga directa o pestaña nueva (sin historial, length <= 1), el botón volver redirige a '/'", () => {
    render(<TerminosPage />);

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
    render(<TerminosPage />);

    const volverButtons = screen.getAllByRole("button", { name: /volver/i });
    expect(volverButtons.length).toBe(2);

    fireEvent.click(volverButtons[0]);
    expect(back).toHaveBeenCalledTimes(1);
    expect(push).not.toHaveBeenCalled();

    fireEvent.click(volverButtons[1]);
    expect(back).toHaveBeenCalledTimes(2);
  });
});
