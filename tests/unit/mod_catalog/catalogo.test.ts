import { describe, it, expect } from "vitest";
import {
  availabilityMeta,
  findVariantSku,
  formatPrice,
  mapCarouselItem,
  mapProductDetail,
  safeImageUrl,
  toAvailabilityState,
} from "@/modules/mod-catalog/domain/entities/CatalogoUI";

describe("mappers de catálogo (SPEC-06, SPEC-09)", () => {
  it("mapea item de carrusel con fallbacks", () => {
    const item = mapCarouselItem(
      { product_id: "prod-001", name: "Nike Revolution", price: 279.9, availability: "DISPONIBLE", single_sku: "NIKE-UNICO" },
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

  it("precio inválido cae a null y estado raro a SIN_DATO", () => {
    const item = mapCarouselItem(
      { product_id: "x", price: -5, availability: "RARO" } as never,
      2
    );
    expect(item.price).toBeNull();
    expect(item.availability).toBe("SIN_DATO");
  });

  it("STOCK_BAJO del inventario se traduce a POCAS_UNIDADES", () => {
    expect(toAvailabilityState("STOCK_BAJO")).toBe("POCAS_UNIDADES");
    expect(toAvailabilityState("POCAS_UNIDADES")).toBe("POCAS_UNIDADES");
    expect(toAvailabilityState("AGOTADO")).toBe("AGOTADO");
    expect(toAvailabilityState("DISPONIBLE")).toBe("DISPONIBLE");
  });

  it("solo el literal INDETERMINADO es indeterminado; el resto es disponibilidad no obtenida", () => {
    expect(toAvailabilityState("INDETERMINADO")).toBe("INDETERMINADO");
    expect(toAvailabilityState(undefined)).toBe("SIN_DATO");
    expect(toAvailabilityState(null)).toBe("SIN_DATO");
    expect(toAvailabilityState("")).toBe("SIN_DATO");
    expect(toAvailabilityState("DESCONOCIDA")).toBe("SIN_DATO");
    expect(toAvailabilityState("__proto__")).toBe("SIN_DATO");
  });

  it("detalle usa el resumen real del backend (short_description, image, price_text)", () => {
    const detail = mapProductDetail({
      product_id: "prod-001",
      name: "Nike Revolution",
      brand: "Nike",
      image: "https://cdn.example.com/a.jpg",
      price: 279.9,
      price_text: "S/ 279.90",
      short_description: "Calzado para correr",
      has_variants: true,
      availability: "POCAS_UNIDADES",
      variants: [
        { sku: "A-42", talla: "42", color: "Negro" },
        { sku: "A-43", talla: "43", color: "Negro" },
      ],
    });
    expect(detail.shortDescription).toBe("Calzado para correr");
    expect(detail.image).toBe("https://cdn.example.com/a.jpg");
    expect(detail.priceText).toBe("S/ 279.90");
    expect(detail.tallas).toEqual(["42", "43"]);
    expect(detail.colores).toEqual(["Negro"]);
    // El backend no manda description/images: ya no existen en el tipo.
    // @ts-expect-error detail no expone `description`
    expect(detail.description).toBeUndefined();
  });

  it("detalle sin short_description no inventa texto de respaldo", () => {
    const detail = mapProductDetail({ product_id: "p", name: "Sin texto" });
    expect(detail.shortDescription).toBeUndefined();
    expect(detail.image).toBeUndefined();
    expect(detail.availability).toBe("SIN_DATO");
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

  it("conserva single_sku para productos sin variantes", () => {
    const detail = mapProductDetail({ product_id: "p", single_sku: "UNICO-1" });
    expect(detail.singleSku).toBe("UNICO-1");
  });
});

describe("precio, imagen y etiquetas de disponibilidad", () => {
  it("formatPrice renders validated PEN with two decimals", () => {
    expect(formatPrice({ priceText: "S/ 279.90", price: 279.9 })).toBe("S/ 279.90");
    expect(formatPrice({ price: 12.5 })).toBe("S/ 12.50");
    expect(formatPrice({ priceText: "  ", price: 0 })).toBe("S/ 0.00");
  });

  it("safeImageUrl solo acepta http/https", () => {
    expect(safeImageUrl("https://cdn.example.com/a.jpg")).toBe("https://cdn.example.com/a.jpg");
    expect(safeImageUrl("http://cdn.example.com/a.jpg")).toBe("http://cdn.example.com/a.jpg");
    expect(safeImageUrl("javascript:alert(1)")).toBeUndefined();
    expect(safeImageUrl("data:image/png;base64,AAAA")).toBeUndefined();
    expect(safeImageUrl("/relativa.jpg")).toBeUndefined();
    expect(safeImageUrl("")).toBeUndefined();
    expect(safeImageUrl(null)).toBeUndefined();
  });

  it("INDETERMINADO y SIN_DATO no pintan etiqueta de stock", () => {
    expect(availabilityMeta("INDETERMINADO")).toEqual({
      label: null,
      tone: "unknown",
    });
    expect(availabilityMeta("SIN_DATO")).toEqual({
      label: null,
      tone: "unknown",
    });
    expect(availabilityMeta("AGOTADO").tone).toBe("out");
    expect(availabilityMeta("POCAS_UNIDADES").tone).toBe("low");
    expect(availabilityMeta("DISPONIBLE").tone).toBe("ok");
  });
});
