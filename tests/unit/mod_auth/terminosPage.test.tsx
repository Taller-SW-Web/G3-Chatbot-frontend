// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { TerminosPage } from "@/modules/mod-auth/ui/TerminosPage";

const back = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  useRouter: () => ({ back }),
}));

afterEach(cleanup);

describe("TerminosPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza el título y los términos principales", () => {
    render(<TerminosPage />);

    expect(screen.getByText("TÉRMINOS Y CONDICIONES")).toBeDefined();
    expect(screen.getAllByText(/Inka Athletics/).length).toBeGreaterThan(0);
    expect(screen.getByText(/1\. Ámbito y Uso del Canal/)).toBeDefined();
    expect(screen.getByText(/2\. Asistente Virtual y Seguridad de Datos/)).toBeDefined();
  });

  it("permite regresar con el botón volver del header o del pie", () => {
    render(<TerminosPage />);

    const volverButtons = screen.getAllByRole("button", { name: /volver/i });
    expect(volverButtons.length).toBe(2);

    fireEvent.click(volverButtons[0]);
    expect(back).toHaveBeenCalledTimes(1);

    fireEvent.click(volverButtons[1]);
    expect(back).toHaveBeenCalledTimes(2);
  });
});
