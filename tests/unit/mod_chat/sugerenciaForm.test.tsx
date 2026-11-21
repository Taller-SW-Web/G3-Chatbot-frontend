// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SugerenciaForm } from "@/modules/mod-chat/ui/SugerenciaForm";

const onEnviado = vi.fn();
const onCancelar = vi.fn();
const onEnviar = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn(() => "blob:captura"),
  });
  onEnviar.mockResolvedValue({ codigoSeguimiento: "SUG-2026-0142" });
});

afterEach(cleanup);

function montar() {
  return render(
    <SugerenciaForm
      correo="ana@ejemplo.pe"
      onEnviar={onEnviar}
      onEnviado={onEnviado}
      onCancelar={onCancelar}
    />
  );
}

function completar(titulo = "Filtro por talla", detalle = "Quiero filtrar por talla 42") {
  fireEvent.change(screen.getByLabelText("Título"), { target: { value: titulo } });
  fireEvent.change(screen.getByLabelText("Descripción de la experiencia"), { target: { value: detalle } });
}

describe("SugerenciaForm (SPEC-24 Req. 4)", () => {
  it("mantiene Enviar deshabilitado hasta completar título y descripción", () => {
    montar();

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

  it("envía una sugerencia al backend y confirma con su código", async () => {
    montar();
    completar();

    fireEvent.click(screen.getByRole("button", { name: "ENVIAR" }));

    expect(await screen.findByText("¡GRACIAS POR TU SUGERENCIA!")).toBeDefined();
    expect(screen.getByText(/SUG-2026-0142/)).toBeDefined();
    expect(onEnviar).toHaveBeenCalledWith({
      tipo: "SUGERENCIA",
      titulo: "Filtro por talla",
      descripcion: "Quiero filtrar por talla 42",
      correo: "ana@ejemplo.pe",
      captura: undefined,
    });

    fireEvent.click(screen.getByRole("button", { name: "ENTENDIDO" }));
    expect(onEnviado).toHaveBeenCalledWith("SUG-2026-0142");
  });

  it("reporta un bug con el código que devuelve el backend", async () => {
    onEnviar.mockResolvedValueOnce({ codigoSeguimiento: "BUG-2026-0031" });
    montar();

    fireEvent.click(screen.getByRole("button", { name: "BUG" }));
    expect(screen.getByLabelText("Título").getAttribute("placeholder")).toContain("No carga el seguimiento");

    completar("No carga", "La pantalla queda en blanco");
    fireEvent.click(screen.getByRole("button", { name: "ENVIAR" }));

    expect(await screen.findByText("¡GRACIAS POR REPORTAR EL BUG!")).toBeDefined();
    expect(screen.getByText(/BUG-2026-0031/)).toBeDefined();
    expect(onEnviar).toHaveBeenCalledWith(expect.objectContaining({ tipo: "BUG" }));
  });

  it("adjunta una captura, la envía con el formulario y permite quitarla", async () => {
    montar();
    const archivo = new File(["x"], "captura.png", { type: "image/png" });
    const input = screen.getByLabelText("Elegir captura de la biblioteca");

    fireEvent.change(input, { target: { files: [archivo] } });
    expect(screen.getByRole("img", { name: /Vista previa de captura\.png/ })).toBeDefined();
    expect(screen.getByText("Cambiar")).toBeDefined();

    completar();
    fireEvent.click(screen.getByRole("button", { name: "ENVIAR" }));
    expect(await screen.findByText(/con tu captura adjunta/)).toBeDefined();
    expect(onEnviar).toHaveBeenCalledWith(expect.objectContaining({ captura: archivo }));

    fireEvent.click(screen.getByRole("button", { name: "ENTENDIDO" }));
    // El modal se cierra y la captura sigue adjunta hasta quitarla.
    fireEvent.click(screen.getByText("Quitar"));
    expect(screen.queryByRole("img", { name: /captura\.png/ })).toBeNull();
  });

  it("rechaza una captura que no es JPG/PNG sin bloquear el envío", () => {
    montar();
    const input = screen.getByLabelText("Elegir captura de la biblioteca");
    fireEvent.change(input, {
      target: { files: [new File(["x"], "captura.gif", { type: "image/gif" })] },
    });

    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.getByText(/JPG o PNG de hasta 5 MB/)).toBeDefined();
    completar();
    expect((screen.getByRole("button", { name: "ENVIAR" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("conserva lo escrito y muestra el límite de sugerencias cuando el backend responde 429", async () => {
    onEnviar.mockRejectedValueOnce({
      response: { status: 429, data: { code: "DEMASIADAS_SOLICITUDES" } },
    });
    montar();
    completar();
    fireEvent.click(screen.getByRole("button", { name: "ENVIAR" }));

    expect(await screen.findByText("Ya enviaste varias sugerencias, intenta en un rato")).toBeDefined();
    expect((screen.getByLabelText("Título") as HTMLInputElement).value).toBe("Filtro por talla");
    expect(screen.queryByText("¡GRACIAS POR TU SUGERENCIA!")).toBeNull();
  });

  it("cancela sin enviar", () => {
    montar();
    fireEvent.click(screen.getByRole("button", { name: "CANCELAR" }));
    expect(onCancelar).toHaveBeenCalledTimes(1);
    expect(onEnviado).not.toHaveBeenCalled();
    expect(onEnviar).not.toHaveBeenCalled();
  });
});
