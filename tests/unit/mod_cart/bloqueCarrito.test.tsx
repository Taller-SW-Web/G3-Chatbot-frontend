// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { BloqueCarrito } from "@/modules/mod-cart/ui/blocks/BloqueCarrito";
import type { DatosCarritoBloque } from "@/modules/mod-cart/domain/entities/DatosCarritoBloque";

describe("BloqueCarrito: gate de pago (SPEC-11)", () => {
  afterEach(cleanup);

  const baseDatos: DatosCarritoBloque = {
    lineas: [
      {
        item_id: "item-1",
        sku: "SKU-1",
        nombre: "Zapatilla running",
        cantidad: 1,
        precio: 150,
        disponible: true,
      },
    ],
    subtotal: 150,
    total: 150,
    promociones_ok: true,
  };

  it("permite pagar cuando el carrito tiene stock y promociones_ok", () => {
    const onPagar = vi.fn();
    const onVerCarrito = vi.fn();
    render(<BloqueCarrito datos={baseDatos} onPagar={onPagar} onVerCarrito={onVerCarrito} />);

    const btn = screen.getByTestId("btn-pagar") as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
    fireEvent.click(btn);
    expect(onPagar).toHaveBeenCalledTimes(1);
  });

  it("deshabilita pagar y muestra motivo si promociones_ok es false", () => {
    const onPagar = vi.fn();
    const datos: DatosCarritoBloque = {
      ...baseDatos,
      promociones_ok: false,
    };
    render(<BloqueCarrito datos={datos} onPagar={onPagar} onVerCarrito={vi.fn()} />);

    const btn = screen.getByTestId("btn-pagar") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.getAttribute("aria-describedby")).toBe("motivo-bloqueo-pago-chat");
    expect(screen.getByText("No pudimos calcular promociones en este momento.")).toBeDefined();

    fireEvent.click(btn);
    expect(onPagar).not.toHaveBeenCalled();
  });

  it("deshabilita pagar si no hay líneas en el carrito", () => {
    const onPagar = vi.fn();
    const datos: DatosCarritoBloque = {
      ...baseDatos,
      lineas: [],
      subtotal: 0,
      total: 0,
    };
    render(<BloqueCarrito datos={datos} onPagar={onPagar} onVerCarrito={vi.fn()} />);

    const btn = screen.getByTestId("btn-pagar") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(screen.getByText("El carrito está vacío.")).toBeDefined();

    fireEvent.click(btn);
    expect(onPagar).not.toHaveBeenCalled();
  });

  it("deshabilita pagar si alguna línea no está disponible", () => {
    const onPagar = vi.fn();
    const datos: DatosCarritoBloque = {
      ...baseDatos,
      lineas: [
        {
          item_id: "item-1",
          sku: "SKU-1",
          nombre: "Zapatilla running",
          cantidad: 1,
          precio: 150,
          disponible: false,
        },
      ],
    };
    render(<BloqueCarrito datos={datos} onPagar={onPagar} onVerCarrito={vi.fn()} />);

    const btn = screen.getByTestId("btn-pagar") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(screen.getByText("Hay productos sin stock disponible en el carrito.")).toBeDefined();

    fireEvent.click(btn);
    expect(onPagar).not.toHaveBeenCalled();
  });
});
