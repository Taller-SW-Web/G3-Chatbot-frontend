// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DeliveryRating } from "@/modules/mod-orders/ui/DeliveryRating";

const onRate = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  onRate.mockResolvedValue(undefined);
});

afterEach(cleanup);

function abrir() {
  return render(<DeliveryRating orderId="PED-2026-00002" onRate={onRate} />);
}

describe("DeliveryRating (CSAT)", () => {
  it("no permite enviar hasta elegir una carita", () => {
    abrir();
    const enviar = screen.getByRole("button", { name: "ENVIAR CALIFICACIÓN" }) as HTMLButtonElement;
    expect(enviar.disabled).toBe(true);

    fireEvent.click(screen.getByRole("radio", { name: "Regular" }));
    expect(enviar.disabled).toBe(false);
    expect(screen.getByRole("radio", { name: "Regular" }).getAttribute("aria-checked")).toBe("true");
  });

  it("envía la puntuación con el comentario opcional", async () => {
    abrir();
    fireEvent.click(screen.getByRole("radio", { name: "Bien" }));
    fireEvent.change(screen.getByLabelText(/Comentario/), { target: { value: "Llegó antes de lo previsto" } });
    fireEvent.click(screen.getByRole("button", { name: "ENVIAR CALIFICACIÓN" }));

    await waitFor(() =>
      expect(onRate).toHaveBeenCalledWith("PED-2026-00002", "bien", "Llegó antes de lo previsto")
    );
    expect(await screen.findByText(/Gracias por tu calificación/)).toBeDefined();
  });

  it("envía sin comentario cuando el cliente no escribe nada", async () => {
    abrir();
    fireEvent.click(screen.getByRole("radio", { name: "Mal" }));
    fireEvent.click(screen.getByRole("button", { name: "ENVIAR CALIFICACIÓN" }));

    await waitFor(() => expect(onRate).toHaveBeenCalledWith("PED-2026-00002", "mal", undefined));
  });

  it("muestra 'Ya calificaste este pedido' ante 409 sin error rojo", async () => {
    onRate.mockRejectedValue({
      response: { status: 409, data: { code: "CSAT_ALREADY_SUBMITTED" } },
    });
    abrir();

    fireEvent.click(screen.getByRole("radio", { name: "Bien" }));
    fireEvent.click(screen.getByRole("button", { name: "ENVIAR CALIFICACIÓN" }));

    expect(await screen.findByText("Ya calificaste este pedido")).toBeDefined();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("button", { name: "ENVIAR CALIFICACIÓN" })).toBeNull();
  });

  it("explica que solo se califican pedidos entregados ante 422", async () => {
    onRate.mockRejectedValue({
      response: { status: 422, data: { code: "ORDER_NOT_DELIVERED" } },
    });
    abrir();

    fireEvent.click(screen.getByRole("radio", { name: "Regular" }));
    fireEvent.click(screen.getByRole("button", { name: "ENVIAR CALIFICACIÓN" }));

    expect(await screen.findByText("Solo puedes calificar pedidos entregados.")).toBeDefined();
  });

  it("ante un fallo de red conserva la calificación para reintentar", async () => {
    onRate.mockRejectedValueOnce(new Error("network down"));
    abrir();

    fireEvent.click(screen.getByRole("radio", { name: "Bien" }));
    fireEvent.click(screen.getByRole("button", { name: "ENVIAR CALIFICACIÓN" }));

    expect(await screen.findByRole("alert")).toBeDefined();
    expect(screen.getByText(/No pudimos enviar tu calificación/)).toBeDefined();
    const reintentar = screen.getByRole("button", { name: "ENVIAR CALIFICACIÓN" }) as HTMLButtonElement;
    expect(reintentar.disabled).toBe(false);

    fireEvent.click(reintentar);
    await waitFor(() => expect(onRate).toHaveBeenCalledTimes(2));
    expect(await screen.findByText(/Gracias por tu calificación/)).toBeDefined();
  });
});
