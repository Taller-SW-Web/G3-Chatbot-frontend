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

  it("renderiza el título, el aviso de proyecto y todas las secciones mínimas de docs/conversacion/privacidad.md §5", () => {
    render(<PrivacidadPage />);

    expect(screen.getByText("POLÍTICA DE PRIVACIDAD")).toBeDefined();
    expect(screen.getByText(/Aviso del proyecto académico/i)).toBeDefined();
    expect(screen.getAllByText(/Inka Athletics/).length).toBeGreaterThan(0);

    // Secciones requeridas por §5 y revisión
    expect(screen.getByText(/1\. Responsable del Tratamiento/i)).toBeDefined();
    expect(screen.getByText(/2\. Datos Personales que se Tratan/i)).toBeDefined();
    expect(screen.getByText(/3\. Finalidades del Tratamiento/i)).toBeDefined();
    expect(screen.getByText(/4\. Destinatarios de los Datos/i)).toBeDefined();
    expect(screen.getByText(/5\. Transferencia Internacional de Datos/i)).toBeDefined();
    expect(screen.getByText(/6\. Uso de Inteligencia Artificial y Reglas de Protección/i)).toBeDefined();
    expect(screen.getByText(/7\. Conservación de Datos/i)).toBeDefined();
    expect(screen.getByText(/8\. Derechos del Titular \(ARCO\)/i)).toBeDefined();
    expect(screen.getByText(/9\. Banco de Datos Personales/i)).toBeDefined();
    expect(screen.getByText(/10\. Almacenamiento en el Navegador/i)).toBeDefined();
    expect(screen.getByText(/11\. Consecuencia de no Proporcionar los Datos/i)).toBeDefined();

    // Verificación de cláusula de pendiente de definición en puntos institucionales
    expect(screen.getAllByText(/pendiente de definición/i).length).toBeGreaterThan(0);
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
