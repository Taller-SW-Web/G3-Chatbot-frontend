// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DevolucionForm } from "@/adapters/inbound/components/forms/DevolucionForm";

const onOk = vi.fn();
const onCancelar = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn(() => "blob:evidencia"),
  });
});

afterEach(cleanup);

function abrir(lineas = ["Zapatilla Volta · 42", "Zapatilla Volta · 43"]) {
  return render(<DevolucionForm lineas={lineas} onOk={onOk} onCancelar={onCancelar} />);
}

describe("DevolucionForm", () => {
  it("lista las líneas del pedido y arranca en cambio", () => {
    abrir();

    const linea = screen.getByLabelText("Línea a devolver") as HTMLSelectElement;
    expect(linea.value).toBe("Zapatilla Volta · 42");
    expect(screen.getByLabelText("Talla o color deseado")).toBeDefined();
    expect(screen.getByRole("button", { name: "CAMBIO" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("en devolución oculta la talla deseada", () => {
    abrir();
    fireEvent.click(screen.getByRole("button", { name: "DEVOLUCIÓN" }));

    expect(screen.getByRole("button", { name: "DEVOLUCIÓN" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.queryByLabelText("Talla o color deseado")).toBeNull();
  });

  it("envía la solicitud con línea, motivo y descripción", async () => {
    abrir();

    fireEvent.change(screen.getByLabelText("Motivo"), { target: { value: "Producto defectuoso" } });
    fireEvent.change(screen.getByLabelText("Descripción"), { target: { value: "Llegó con la suela rota" } });
    expect(screen.getByText(/^\d+\/1000$/)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /ENVIAR SOLICITUD/ }));

    await waitFor(() => expect(onOk).toHaveBeenCalledTimes(1));
    expect(onOk).toHaveBeenCalledWith(expect.objectContaining({
      tipo: "CAMBIO",
      linea: "Zapatilla Volta · 42",
      motivo: "Producto defectuoso",
      descripcion: "Llegó con la suela rota",
    }));
  });

  it("adjunta evidencia, la pesa y la incluye en el envío", async () => {
    abrir();
    const archivo = new File(["x".repeat(2048)], "suela.png", { type: "image/png" });

    fireEvent.change(screen.getByLabelText("Subir evidencia"), { target: { files: [archivo] } });

    expect(screen.getByText("suela.png")).toBeDefined();
    expect(screen.getByText(/2 KB · JPG\/PNG\/WEBP\/PDF/)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /ENVIAR SOLICITUD/ }));

    await waitFor(() => expect(onOk).toHaveBeenCalledWith(expect.objectContaining({
      evidenciaNombre: "suela.png",
      evidenciaTamano: 2048,
    })));
  });

  it("permite quitar la evidencia antes de enviar", () => {
    abrir();
    const archivo = new File(["x"], "suela.png", { type: "image/png" });

    fireEvent.change(screen.getByLabelText("Subir evidencia"), { target: { files: [archivo] } });
    fireEvent.click(screen.getByText("Quitar"));

    expect(screen.queryByText("suela.png")).toBeNull();
    expect(screen.getByText(/Evidencia \(JPG\/PNG/)).toBeDefined();
  });

  it("cancela sin enviar", () => {
    abrir();
    fireEvent.click(screen.getByRole("button", { name: "CANCELAR" }));

    expect(onCancelar).toHaveBeenCalledTimes(1);
    expect(onOk).not.toHaveBeenCalled();
  });

  it("sin líneas mantiene la línea vacía y no deja enviar", async () => {
    abrir([]);
    fireEvent.click(screen.getByRole("button", { name: /ENVIAR SOLICITUD/ }));

    // El schema exige línea: la validación frena el envío sin pintar mensaje.
    await Promise.resolve();
    expect(onOk).not.toHaveBeenCalled();
    expect((screen.getByLabelText("Línea a devolver") as HTMLSelectElement).value).toBe("");
  });
});
