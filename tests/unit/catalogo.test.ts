import { describe, it, expect } from "vitest";
import {
  mapCarouselItem,
  mapProductDetail,
  findVariantSku,
  toAvailabilityState,
} from "@/domain/entities/CatalogoUI";

describe("mappers de catálogo (SPEC-06, SPEC-09)", () => {
  it("mapea item de carrusel con fallbacks", () => {
    const item = mapCarouselItem(
      { product_id: "prod-001", name: "Nike Revolution", price: 279.9, availability: "DISPONIBLE" },
      1
    );
    expect(item).toMatchObject({
      ref: 1,
      product_id: "prod-001",
      name: "Nike Revolution",
      price: 279.9,
      hasVariants: false,
      availability: "DISPONIBLE",
    });
  });

  it("precio inválido cae a 0 y estado raro a INDETERMINADO", () => {
    const item = mapCarouselItem(
      { product_id: "x", price: -5, availability: "RARO" } as never,
      2
    );
    expect(item.price).toBe(0);
    expect(item.availability).toBe("INDETERMINADO");
    expect(toAvailabilityState("POCAS_UNIDADES")).toBe("POCAS_UNIDADES");
  });

  it("detalle con variantes reales y fallback de descripción", () => {
    const detail = mapProductDetail({
      product_id: "prod-001",
      name: "Nike Revolution",
      description: null,
      variants: [
        { sku: "A-42", talla: "42", color: "negro" },
        { sku: "A-43", talla: "43", color: "negro" },
      ],
    });
    expect(detail.description).toContain("Nike Revolution");
    expect(detail.tallas).toEqual(["42", "43"]);
    expect(detail.colores).toEqual(["negro"]);
  });

  it("resuelve SKU exacto o pide variante", () => {
    const detail = mapProductDetail({
      product_id: "p",
      variants: [{ sku: "A-42", talla: "42", color: "negro" }],
    });
    expect(findVariantSku(detail, "42", "negro")).toBe("A-42");
    expect(findVariantSku(detail, "42", null)).toBeNull();
    expect(findVariantSku(detail, "44", "rojo")).toBeNull();
  });
});
