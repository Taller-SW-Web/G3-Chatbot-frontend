// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CarruselProductos } from "@/modules/mod-catalog/ui/blocks/CarruselProductos";
import { mapCarouselItem } from "@/modules/mod-catalog/domain/entities/CatalogoUI";
import { MessageBubble } from "@/modules/mod-chat/ui/MessageBubble";
import type { Bloque } from "@/modules/mod-chat/domain/entities/Bloque";

/** SPEC-06 Req. 4 · Scenario «Más de 10 resultados» y vacío con ACCIONES_RAPIDAS. */

const card = (n: number) => ({
  product_id: `fixture-${n}`,
  name: `Producto ${n}`,
  price: "100.00",
  regular_price: "100.00",
  availability: "DISPONIBLE",
  single_sku: `SKU-${n}`,
});

const siguiente = {
  pagina: 2,
  q: "running",
  categoriaId: "cat-zapatillas",
  marcaId: "brand-nike",
  precioMin: null,
  precioMax: 350,
  orden: "precio_asc",
  soloOfertas: false,
};

const productos = Array.from({ length: 12 }, (_, index) =>
  mapCarouselItem(card(index + 1), index + 1)
);

afterEach(cleanup);

describe("CARRUSEL_PRODUCTOS paginado", () => {
  it("muestra 10 tarjetas, «Mostrando 10 de 34» y envía siguiente sin reconstruirlo", () => {
    const onSiguiente = vi.fn();
    render(
      <CarruselProductos
        productos={productos}
        total={34}
        siguiente={siguiente}
        onAdd={vi.fn()}
        onDetalle={vi.fn()}
        onSiguiente={onSiguiente}
      />
    );

    expect(screen.getByText("Mostrando 10 de 34")).toBeTruthy();
    expect(screen.getByText("Producto 10")).toBeTruthy();
    expect(screen.queryByText("Producto 11")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Ver más" }));
    expect(onSiguiente).toHaveBeenCalledWith(siguiente);
  });

  it("no muestra «Ver más» sin siguiente y conserva el contador", () => {
    render(
      <CarruselProductos
        productos={productos.slice(0, 7)}
        total={7}
        siguiente={null}
        onAdd={vi.fn()}
        onDetalle={vi.fn()}
        onSiguiente={vi.fn()}
      />
    );

    expect(screen.getByText("Mostrando 7 de 7")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Ver más" })).toBeNull();
  });

  it("ignora un siguiente malformado o una página que no avanza", () => {
    render(
      <CarruselProductos
        productos={productos.slice(0, 3)}
        total={34}
        siguiente={{ pagina: 1 }}
        onAdd={vi.fn()}
        onDetalle={vi.fn()}
        onSiguiente={vi.fn()}
      />
    );

    expect(screen.queryByRole("button", { name: "Ver más" })).toBeNull();
  });

  it("despacha BUSCAR_PAGINA con el payload exacto desde el chat", () => {
    const action = vi.fn();
    render(
      <MessageBubble
        texto="Encontré 34 productos; se muestran en pantalla con precio y disponibilidad."
        rol="bot"
        bloques={[{
          tipo: "CARRUSEL_PRODUCTOS",
          datos: { productos: productos.slice(0, 10), total: 34, siguiente },
        } as Bloque]}
        onQuickAction={action}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Ver más" }));

    expect(action).toHaveBeenCalledWith({
      id: "BUSCAR_PAGINA",
      etiqueta: "Ver más",
      payload: siguiente,
    });
  });

  it("muestra el vacío con chips de relajación de ACCIONES_RAPIDAS", () => {
    const action = vi.fn();
    render(
      <MessageBubble
        texto="No encontré productos con esos filtros. Prueba quitando un filtro o buscando por categoría."
        rol="bot"
        bloques={[{
          tipo: "ACCIONES_RAPIDAS",
          acciones: [
            {
              id: "BUSCAR_PRODUCTOS",
              etiqueta: "Buscar sin precio máximo",
              payload: { categoriaId: "cat-zapatillas", marcaId: "brand-nike" },
            },
          ],
        } as Bloque]}
        onQuickAction={action}
      />
    );

    expect(screen.getByText(/No encontré productos con esos filtros/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Buscar sin precio máximo" }));

    expect(action).toHaveBeenCalledWith({
      id: "BUSCAR_PRODUCTOS",
      etiqueta: "Buscar sin precio máximo",
      payload: { categoriaId: "cat-zapatillas", marcaId: "brand-nike" },
    });
  });
});
