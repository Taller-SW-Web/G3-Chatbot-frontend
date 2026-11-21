// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProductCard } from "@/modules/mod-catalog/ui/ProductCard";
import { ProductDetailModal } from "@/modules/mod-catalog/ui/blocks/DetalleProducto";
import { DevolucionForm } from "@/modules/mod-postventa/ui/forms/DevolucionForm";
import { mensajeCarrito } from "@/modules/mod-cart/application/errors/carritoMensajes";
import {
  canAddCard,
  mapCarouselItem,
  mapProductDetail,
  toAvailabilityState,
} from "@/modules/mod-catalog/domain/entities/CatalogoUI";
import { messiClub } from "@/shared/testing/fixtures/messiClub";

/**
 * Acuerdo A17 con Productos (issues #30): la tarjeta no inventa stock ni
 * precios. `INDETERMINADO` no pinta badge y se puede agregar; la disponibilidad
 * no obtenida (`SIN_DATO`) y el precio vacío bloquean "Agregar" sin romper
 * "Ver detalle".
 */

afterEach(cleanup);

function card(row: typeof messiClub | Record<string, unknown>, onAdd = vi.fn()) {
  const onDetalle = vi.fn();
  render(
    <ProductCard
      producto={mapCarouselItem(row as typeof messiClub, 1)}
      onDetalle={onDetalle}
      onAdd={onAdd}
    />
  );
  return { onAdd, onDetalle };
}

describe("A17 · disponibilidad y precio en tarjetas", () => {
  it("INDETERMINADO no muestra badge ni 'Pocas unidades' y permite agregar", () => {
    const { onAdd } = card({ ...messiClub, availability: "INDETERMINADO" });

    expect(screen.queryByTestId("badge-indeterminado")).toBeNull();
    expect(screen.queryByTestId("badge-disponible")).toBeNull();
    expect(screen.queryByTestId("badge-pocas-unidades")).toBeNull();
    expect(screen.queryByText(/Quedan pocas unidades/)).toBeNull();

    const agregar = screen.getByTestId("btn-agregar") as HTMLButtonElement;
    expect(agregar.disabled).toBe(false);
    fireEvent.click(agregar);
    expect(onAdd).toHaveBeenCalledOnce();
  });

  it.each([{ availability: null }, { availability: undefined }, { availability: "DESCONOCIDA" }])(
    "la disponibilidad ausente o desconocida (%j) va sin badge y no habilita Agregar",
    (changes) => {
      const { onDetalle } = card({ ...messiClub, ...changes });

      expect(screen.queryByTestId("badge-indeterminado")).toBeNull();
      expect(screen.queryByTestId("badge-disponible")).toBeNull();
      expect(screen.queryByTestId("badge-agotado")).toBeNull();
      expect(screen.queryByText(/Quedan pocas unidades/)).toBeNull();
      expect((screen.getByTestId("btn-agregar") as HTMLButtonElement).disabled).toBe(true);

      fireEvent.click(screen.getByTestId("btn-detalle"));
      expect(onDetalle).toHaveBeenCalledOnce();
    }
  );

  it("el precio vacío muestra 'Precio no disponible' y no S/ 0.00", () => {
    card({ ...messiClub, price: null });

    expect(screen.getByText("Precio no disponible")).toBeTruthy();
    expect(screen.queryByText("S/ 0.00")).toBeNull();
    expect((screen.getByTestId("btn-agregar") as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByTestId("btn-detalle")).toBeTruthy();
  });

  it("el detalle con precio vacío mantiene 'Ver detalle' y deshabilita el agregado", () => {
    const onAdd = vi.fn();
    const detail = mapProductDetail({ ...messiClub, price: null });
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <ProductDetailModal p={detail} onClose={vi.fn()} onAdd={onAdd} />
      </QueryClientProvider>
    );

    expect(screen.getByText("Precio no disponible")).toBeTruthy();
    expect(screen.queryByText("S/ 0.00")).toBeNull();
    expect((screen.getByRole("button", { name: "AGREGAR AL CARRITO" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "AGREGAR AL CARRITO" }));
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("mapea a INDETERMINADO solo el literal del contrato", () => {
    expect(toAvailabilityState("INDETERMINADO")).toBe("INDETERMINADO");
    expect(toAvailabilityState(undefined)).toBe("SIN_DATO");
    expect(toAvailabilityState("OTRO")).toBe("SIN_DATO");
    expect(canAddCard(mapCarouselItem({ ...messiClub, availability: "INDETERMINADO" }, 1))).toBe(true);
    expect(canAddCard(mapCarouselItem({ ...messiClub, availability: undefined }, 1))).toBe(false);
  });

  it("INDETERMINADO no es un error de stock al agregar", () => {
    expect(mensajeCarrito("INDETERMINADO")).toBe("No pudimos confirmar el stock.");
    expect(mensajeCarrito("SERVICIO_NO_DISPONIBLE")).toBe(
      "No puedo confirmar el stock ahora; intenta en unos segundos."
    );
  });
});

describe("A17 · devoluciones sin etiquetas de stock", () => {
  it("las opciones de cambio no muestran Disponible ni Pocas unidades", () => {
    render(<DevolucionForm lineas={["Zapatilla Volta · 42"]} onOk={vi.fn()} onCancelar={vi.fn()} />);

    const opciones = screen.getByLabelText("Talla o color deseado").querySelectorAll("option");
    expect([...opciones].map((o) => o.textContent)).toEqual(["Talla 42 · Negro", "Talla 43 · Negro"]);
    expect(screen.queryByText(/Pocas unidades/)).toBeNull();
    expect(screen.queryByText(/Disponible\)/)).toBeNull();
  });
});
