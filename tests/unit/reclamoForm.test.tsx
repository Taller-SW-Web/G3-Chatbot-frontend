// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ReclamoForm } from "@/adapters/inbound/components/forms/ReclamoForm";

const onOk = vi.fn();
const onCancelar = vi.fn();
const DESCRIPCION = "El producto llegó con la suela despegada y no puedo usarlo";

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

function abrir() {
  return render(<ReclamoForm pedidoId="PED-2026-00891" onOk={onOk} onCancelar={onCancelar} />);
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

  it("envía el reclamo con motivo, documento y solución", async () => {
    abrir();

    fireEvent.change(screen.getByLabelText("Motivo del reclamo"), {
      target: { value: "Producto equivocado" },
    });
    fireEvent.change(screen.getByLabelText(/Descripci.n del reclamo/), { target: { value: DESCRIPCION } });
    fireEvent.change(screen.getByLabelText("Documento"), { target: { value: "DNI 12345678" } });
    fireEvent.change(screen.getByLabelText(/Soluci.n esperada/), { target: { value: "Cambio del producto" } });
    fireEvent.click(screen.getByRole("button", { name: /ENVIAR RECLAMO/ }));

    await waitFor(() => expect(onOk).toHaveBeenCalledTimes(1));
    expect(onOk).toHaveBeenCalledWith({
      pedidoId: "PED-2026-00891",
      tipo: "RECLAMO",
      motivo: "Producto equivocado",
      descripcion: DESCRIPCION,
      documento: "DNI 12345678",
      solucion: "Cambio del producto",
    });
  });

  it("permite registrarlo como queja", async () => {
    abrir();

    fireEvent.click(screen.getByLabelText("Queja"));
    fireEvent.change(screen.getByLabelText(/Descripci.n del reclamo/), { target: { value: DESCRIPCION } });
    fireEvent.click(screen.getByRole("button", { name: /ENVIAR RECLAMO/ }));

    await waitFor(() => expect(onOk).toHaveBeenCalledWith(expect.objectContaining({ tipo: "QUEJA" })));
  });

  it("cancela sin enviar", () => {
    abrir();
    fireEvent.click(screen.getByRole("button", { name: "CANCELAR" }));

    expect(onCancelar).toHaveBeenCalledTimes(1);
    expect(onOk).not.toHaveBeenCalled();
  });
});
