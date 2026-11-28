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
});
