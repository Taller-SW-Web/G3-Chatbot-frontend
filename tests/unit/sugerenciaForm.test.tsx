// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SugerenciaForm } from "@/adapters/inbound/components/SugerenciaForm";

const onEnviado = vi.fn();
const onCancelar = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn(() => "blob:captura"),
  });
});

afterEach(cleanup);

function completar(titulo = "Filtro por talla", detalle = "Quiero filtrar por talla 42") {
  fireEvent.change(screen.getByLabelText("Título"), { target: { value: titulo } });
  fireEvent.change(screen.getByLabelText("Descripción de la experiencia"), { target: { value: detalle } });
}

describe("SugerenciaForm", () => {
  it("mantiene Enviar deshabilitado hasta completar título y descripción", () => {
    render(<SugerenciaForm correo="ana@ejemplo.pe" onEnviado={onEnviado} onCancelar={onCancelar} />);

    const enviar = screen.getByRole("button", { name: "ENVIAR" }) as HTMLButtonElement;
    expect(enviar.disabled).toBe(true);
    expect(screen.getByText(/Completa el título \(mín\. 3\)/)).toBeDefined();

    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "ab" } });
    fireEvent.change(screen.getByLabelText("Descripción de la experiencia"), { target: { value: "corto" } });
    expect(enviar.disabled).toBe(true);

    completar();
    expect(enviar.disabled).toBe(false);
    expect(screen.queryByText(/Completa el título/)).toBeNull();
  });

  it("envía una sugerencia y confirma con su código", () => {
    render(<SugerenciaForm correo="ana@ejemplo.pe" onEnviado={onEnviado} onCancelar={onCancelar} />);
    completar();

    fireEvent.click(screen.getByRole("button", { name: "ENVIAR" }));
    expect(screen.getByText("¡GRACIAS POR TU SUGERENCIA!")).toBeDefined();
    expect(screen.getByText(/SUG-2026-0142/)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "ENTENDIDO" }));
    expect(onEnviado).toHaveBeenCalledWith("SUG-2026-0142");
  });

  it("reporta un bug con su propio código y rubro", () => {
    render(<SugerenciaForm correo="ana@ejemplo.pe" onEnviado={onEnviado} onCancelar={onCancelar} />);

    fireEvent.click(screen.getByRole("button", { name: "BUG" }));
    expect(screen.getByLabelText("Título").getAttribute("placeholder")).toContain("No carga el seguimiento");

    completar("No carga", "La pantalla queda en blanco");
    fireEvent.click(screen.getByRole("button", { name: "ENVIAR" }));

    expect(screen.getByText("¡GRACIAS POR REPORTAR EL BUG!")).toBeDefined();
    expect(screen.getByText(/BUG-2026-0031/)).toBeDefined();
  });

  it("adjunta una captura, permite cambiarla o quitarla", () => {
    const { container } = render(
      <SugerenciaForm correo="ana@ejemplo.pe" onEnviado={onEnviado} onCancelar={onCancelar} />
    );
    const archivo = new File(["x"], "captura.png", { type: "image/png" });
    const input = screen.getByLabelText("Elegir captura de la biblioteca");

    fireEvent.change(input, { target: { files: [archivo] } });
    expect(screen.getByAltText("captura.png")).toBeDefined();
    expect(screen.getByText("Cambiar")).toBeDefined();

    completar();
    fireEvent.click(screen.getByRole("button", { name: "ENVIAR" }));
    expect(screen.getByText(/con tu captura adjunta/)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "ENTENDIDO" }));
    // El modal se cierra y la captura sigue adjunta hasta quitarla.
    fireEvent.click(screen.getByText("Quitar"));
    expect(container.querySelector("img")).toBeNull();
  });

  it("cancela sin enviar", () => {
    render(<SugerenciaForm correo="ana@ejemplo.pe" onEnviado={onEnviado} onCancelar={onCancelar} />);
    fireEvent.click(screen.getByRole("button", { name: "CANCELAR" }));
    expect(onCancelar).toHaveBeenCalledTimes(1);
    expect(onEnviado).not.toHaveBeenCalled();
  });
});
