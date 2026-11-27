// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DevolucionForm } from "@/modules/mod-postventa/ui/forms/DevolucionForm";

const onOk = vi.fn();
const onCancelar = vi.fn();

const LINEAS = [
  { productoId: "P-1", label: "Zapatilla Volta · 42" },
  { productoId: "P-2", label: "Zapatilla Volta · 43" },
];

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn(() => "blob:evidencia"),
  });
});

afterEach(cleanup);

function abrir(lineas = LINEAS) {
  return render(<DevolucionForm lineas={lineas} onOk={onOk} onCancelar={onCancelar} />);
}

describe("DevolucionForm", () => {
  it("lista las líneas del pedido y arranca en cambio", () => {
    abrir();

    const linea = screen.getByLabelText("Línea a devolver") as HTMLSelectElement;
    expect(linea.value).toBe("P-1");
    expect(screen.getByLabelText("Talla o color deseado")).toBeDefined();
    expect(screen.getByRole("button", { name: "CAMBIO" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("en devolución oculta la talla deseada", () => {
    abrir();
    fireEvent.click(screen.getByRole("button", { name: "DEVOLUCIÓN" }));

    expect(screen.getByRole("button", { name: "DEVOLUCIÓN" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.queryByLabelText("Talla o color deseado")).toBeNull();
  });

  it("prellena tipo, línea, motivo y descripción desde el chat", () => {
    const descripcion = "Compré la talla equivocada y ya no la necesito";
    render(
      <DevolucionForm
        lineas={LINEAS}
        tipoInicial="DEVOLUCION_DINERO"
        motivoInicial="YA_NO_LO_QUIERO"
        descripcionInicial={descripcion}
        lineaInicial="P-2"
        onOk={onOk}
        onCancelar={onCancelar}
      />
    );

    expect((screen.getByLabelText("Línea a devolver") as HTMLSelectElement).value).toBe("P-2");
    expect((screen.getByLabelText("Motivo") as HTMLSelectElement).value).toBe("YA_NO_LO_QUIERO");
    expect((screen.getByLabelText("Descripción") as HTMLTextAreaElement).value).toBe(descripcion);
    expect(screen.getByRole("button", { name: "DEVOLUCIÓN" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "CAMBIO" }).getAttribute("aria-pressed")).toBe("false");
    expect(screen.queryByLabelText("Talla o color deseado")).toBeNull();
  });

  it("envía la solicitud con línea, motivo y descripción", async () => {
    abrir();

    fireEvent.change(screen.getByLabelText("Motivo"), { target: { value: "TALLA_INCORRECTA" } });
    fireEvent.change(screen.getByLabelText("Descripción"), { target: { value: "Llegó con la suela rota" } });
    expect(screen.getByText(/^\d+\/1000$/)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /ENVIAR SOLICITUD/ }));

    await waitFor(() => expect(onOk).toHaveBeenCalledTimes(1));
    expect(onOk).toHaveBeenCalledWith(expect.objectContaining({
      tipo: "CAMBIO",
      linea: "P-1",
      motivo: "TALLA_INCORRECTA",
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

  it("exige evidencia cuando el motivo es producto defectuoso", () => {
    abrir();

    fireEvent.change(screen.getByLabelText("Motivo"), { target: { value: "PRODUCTO_DEFECTUOSO" } });

    const enviar = screen.getByRole("button", { name: /ENVIAR SOLICITUD/ }) as HTMLButtonElement;
    expect(screen.getByText("Este motivo exige al menos una evidencia.")).toBeDefined();
    expect(enviar.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText("Subir evidencia"), {
      target: { files: [new File(["x"], "suela.png", { type: "image/png" })] },
    });

    expect(screen.getByText("suela.png")).toBeDefined();
    expect(enviar.disabled).toBe(false);
  });

  it("permite quitar la evidencia antes de enviar", () => {    abrir();
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

  it("permite seleccionar 2 líneas con cantidades distintas", async () => {
    abrir([
      { productoId: "P-1", label: "Zapatilla Volta · 42", cantidadMaxima: 5 },
      { productoId: "P-2", label: "Zapatilla Volta · 43", cantidadMaxima: 5 },
    ]);

    fireEvent.click(screen.getByLabelText("Seleccionar Zapatilla Volta · 43"));
    fireEvent.change(screen.getByLabelText("Cantidad para Zapatilla Volta · 42"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Cantidad para Zapatilla Volta · 43"), { target: { value: "3" } });

    fireEvent.click(screen.getByRole("button", { name: /ENVIAR SOLICITUD/ }));

    await waitFor(() => expect(onOk).toHaveBeenCalledTimes(1));
    expect(onOk).toHaveBeenCalledWith(expect.objectContaining({
      items: [
        { productoId: "P-1", cantidad: 2 },
        { productoId: "P-2", cantidad: 3 },
      ],
    }));
  });

  it("permite adjuntar hasta 3 evidencias", async () => {
    abrir();
    const file1 = new File(["1"], "ev1.png", { type: "image/png" });
    const file2 = new File(["2"], "ev2.png", { type: "image/png" });
    const file3 = new File(["3"], "ev3.png", { type: "image/png" });

    fireEvent.change(screen.getByLabelText("Subir evidencia"), { target: { files: [file1, file2, file3] } });

    expect(screen.getByText("ev1.png")).toBeDefined();
    expect(screen.getByText("ev2.png")).toBeDefined();
    expect(screen.getByText("ev3.png")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /ENVIAR SOLICITUD/ }));

    await waitFor(() => expect(onOk).toHaveBeenCalledTimes(1));
    expect(onOk).toHaveBeenCalledWith(expect.objectContaining({
      evidenciasArchivos: [file1, file2, file3],
    }));
  });

  it("bloquea envío si la variante elegida no tiene stock", async () => {
    abrir([
      {
        productoId: "P-1",
        label: "Zapatilla Volta · 42",
        variantes: [
          { sku: "SKU-42-ROJO", label: "Talla 42 · Rojo", disponible: false },
          { sku: "SKU-42-AZUL", label: "Talla 42 · Azul", disponible: true },
        ],
      },
    ]);

    expect(screen.getByRole("alert").textContent).toContain("Variante seleccionada sin stock");
    const enviar = screen.getByRole("button", { name: /ENVIAR SOLICITUD/ }) as HTMLButtonElement;
    expect(enviar.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText("Talla o color deseado"), {
      target: { value: "SKU-42-AZUL" },
    });

    expect(screen.queryByText("Variante seleccionada sin stock")).toBeNull();
    expect(enviar.disabled).toBe(false);

    fireEvent.click(enviar);
    await waitFor(() => expect(onOk).toHaveBeenCalledTimes(1));
    expect(onOk).toHaveBeenCalledWith(expect.objectContaining({
      varianteDeseada: "SKU-42-AZUL",
    }));
  });

  it("permite añadir evidencia adicional y valida límite", () => {
    abrir();
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, "click");
    fireEvent.click(screen.getByText(/Evidencia \(JPG\/PNG/));
    expect(clickSpy).toHaveBeenCalled();

    const file1 = new File(["1"], "ev1.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Subir evidencia"), { target: { files: [file1] } });
    expect(screen.getByText("ev1.png")).toBeDefined();

    fireEvent.click(screen.getByText(/\+ Adjuntar otra evidencia/));
    expect(clickSpy).toHaveBeenCalledTimes(2);

    const fileGrande = new File(["x"], "grande.png", { type: "image/png" });
    Object.defineProperty(fileGrande, "size", { value: 6 * 1024 * 1024 });
    fireEvent.change(screen.getByLabelText("Subir evidencia"), { target: { files: [fileGrande] } });
    expect(screen.getByText("Cada evidencia debe ser ≤ 5MB")).toBeDefined();

    clickSpy.mockRestore();
  });
});
