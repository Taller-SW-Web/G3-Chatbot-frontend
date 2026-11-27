// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ReclamoForm } from "@/modules/mod-postventa/ui/forms/ReclamoForm";

const onOk = vi.fn();
const onCancelar = vi.fn();
const DESCRIPCION = "El producto llegó con la suela despegada y no puedo usarlo";

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

function abrir() {
  return render(
    <ReclamoForm
      pedidoId="PED-2026-00891"
      telefonoInicial="999888777"
      onOk={onOk}
      onCancelar={onCancelar}
    />
  );
}

describe("ReclamoForm", () => {
  it("muestra el pedido y arranca como reclamo", () => {
    abrir();

    expect(screen.getByText(/Pedido PED-2026-00891/)).toBeDefined();
    expect((screen.getByLabelText("Reclamo") as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole("button", { name: /ENVIAR RECLAMO/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("bloquea el envío hasta llegar a 20 caracteres y cuenta el texto", () => {
    abrir();
    const descripcion = screen.getByLabelText(/Descripci.n del reclamo/);
    const enviar = screen.getByRole("button", { name: /ENVIAR RECLAMO/ }) as HTMLButtonElement;

    fireEvent.change(descripcion, { target: { value: "Muy corto" } });
    expect(enviar.disabled).toBe(true);
    expect(screen.getByText("9/1000")).toBeDefined();

    fireEvent.change(descripcion, { target: { value: DESCRIPCION } });
    expect(enviar.disabled).toBe(false);
    expect(screen.getByText(`${DESCRIPCION.length}/1000`)).toBeDefined();
  });

  it("muestra los 5 motivos de G5, sin OTRO", () => {
    abrir();

    const motivos = screen.getByLabelText("Motivo del reclamo");
    const opciones = Array.from((motivos as HTMLSelectElement).options).map((o) => o.value);
    expect(opciones).toEqual([
      "INCUMPLIMIENTO_PLAZO_ENTREGA",
      "PRODUCTO_DEFECTUOSO_O_INCORRECTO",
      "COBRO_INDEBIDO_O_NO_RECONOCIDO",
      "ATENCION_INADECUADA",
      "INCUMPLIMIENTO_GARANTIA",
    ]);
    expect(opciones).not.toContain("OTRO");
  });

  it("envía el reclamo con motivo, documento y solución", async () => {
    abrir();

    fireEvent.change(screen.getByLabelText("Motivo del reclamo"), {
      target: { value: "PRODUCTO_DEFECTUOSO_O_INCORRECTO" },
    });
    fireEvent.change(screen.getByLabelText(/Descripci.n del reclamo/), { target: { value: DESCRIPCION } });
    fireEvent.change(screen.getByLabelText("Documento"), { target: { value: "DNI 12345678" } });
    fireEvent.change(screen.getByLabelText(/Soluci.n esperada/), { target: { value: "Cambio del producto" } });
    fireEvent.click(screen.getByRole("button", { name: /ENVIAR RECLAMO/ }));

    await waitFor(() => expect(onOk).toHaveBeenCalledTimes(1));
    expect(onOk).toHaveBeenCalledWith({
      pedidoId: "PED-2026-00891",
      tipo: "RECLAMO",
      motivo: "PRODUCTO_DEFECTUOSO_O_INCORRECTO",
      descripcion: DESCRIPCION,
      documento: "DNI 12345678",
      telefono: "999888777",
      solucion: "Cambio del producto",
    });
  });

  it("permite registrarlo como queja", async () => {
    abrir();

    fireEvent.click(screen.getByLabelText("Queja"));
    fireEvent.change(screen.getByLabelText(/Descripci.n del reclamo/), { target: { value: DESCRIPCION } });
    fireEvent.change(screen.getByLabelText("Documento"), { target: { value: "72458912" } });
    fireEvent.click(screen.getByRole("button", { name: /ENVIAR RECLAMO/ }));

    await waitFor(() => expect(onOk).toHaveBeenCalledWith(expect.objectContaining({ tipo: "QUEJA" })));
  });

  it("prellena tipo, motivo, descripción y solución desde el chat", () => {
    const solucion = "Reembolso del monto cobrado";
    render(
      <ReclamoForm
        pedidoId="PED-2026-00891"
        tipoInicial="QUEJA"
        motivoInicial="ATENCION_INADECUADA"
        descripcionInicial={DESCRIPCION}
        solucionInicial={solucion}
        onOk={onOk}
        onCancelar={onCancelar}
      />
    );

    expect((screen.getByLabelText("Queja") as HTMLInputElement).checked).toBe(true);
    expect((screen.getByLabelText("Reclamo") as HTMLInputElement).checked).toBe(false);
    expect((screen.getByLabelText("Motivo del reclamo") as HTMLSelectElement).value).toBe("ATENCION_INADECUADA");
    expect((screen.getByLabelText(/Descripci.n del reclamo/) as HTMLTextAreaElement).value).toBe(DESCRIPCION);
    expect((screen.getByLabelText("Solución esperada") as HTMLInputElement).value).toBe(solucion);
  });

  it("cancela sin enviar", () => {
    abrir();
    fireEvent.click(screen.getByRole("button", { name: "CANCELAR" }));

    expect(onCancelar).toHaveBeenCalledTimes(1);
    expect(onOk).not.toHaveBeenCalled();
  });
});
