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
    const motivo = screen.getByText("No pudimos calcular promociones en este momento.");
    expect(btn.getAttribute("aria-describedby")).toBe(motivo.id);
    expect(motivo).toBeDefined();

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
    expect(screen.getByText("Tu carrito está vacío.")).toBeDefined();

    fireEvent.click(btn);
    expect(onPagar).not.toHaveBeenCalled();
  });

  it("deshabilita pagar si ninguna línea está disponible y distingue estados", () => {
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
          nota: "Agotado",
        },
      ],
    };
    render(<BloqueCarrito datos={datos} onPagar={onPagar} onVerCarrito={vi.fn()} />);

    const btn = screen.getByTestId("btn-pagar") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(screen.getByText("Los productos de tu carrito están agotados.")).toBeDefined();
    expect(screen.getByText("— Agotado")).toBeDefined();

    fireEvent.click(btn);
    expect(onPagar).not.toHaveBeenCalled();
  });

  it("permite pagar en caso mixto (una disponible + una no disponible)", () => {
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
          disponible: true,
        },
        {
          item_id: "item-2",
          sku: "SKU-2",
          nombre: "Medias deportivas",
          cantidad: 1,
          precio: 30,
          disponible: false,
        },
      ],
    };
    render(<BloqueCarrito datos={datos} onPagar={onPagar} onVerCarrito={vi.fn()} />);

    const btn = screen.getByTestId("btn-pagar") as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
    expect(screen.getByText("— Ya no disponible")).toBeDefined();

    fireEvent.click(btn);
    expect(onPagar).toHaveBeenCalledTimes(1);
  });
});
