"use client";

import { http } from "@/shared/api/http";
import { apiConfig } from "@/shared/config/apiConfig";
import type {
  BuscarProductosInput,
  CatalogoPort,
  DisponibilidadPuntual,
  PaginaCatalogo,
} from "@/modules/mod-catalog/ports/catalogoPort";

// Catálogo con datos reales, sin fallback a mocks (SPEC-06, SPEC-09,
// SPEC-10). Los errores problem+json los ramifica la UI por `code`.
export const catalogoApi: CatalogoPort = {
  async buscarProductos(input: BuscarProductosInput): Promise<PaginaCatalogo> {
    const { data } = await http.get(`/catalogo/productos`, {
      params: {
        soloOfertas: input.soloOfertas,
        q: input.q,
        categoria: input.categoria,
        marca: input.marca,
        precioMin: input.precioMin,
        precioMax: input.precioMax,
        orden: input.orden,
        pagina: input.pagina ?? 1,
        tamanio: input.tamanio ?? 10,
      },
      timeout: apiConfig.timeouts.listadoCatalogo,
    });
    return data as PaginaCatalogo;
  },
  async verDetalleProducto(productId: string): Promise<unknown> {
    const { data } = await http.get(
      `/catalogo/productos/${encodeURIComponent(productId)}`,
      { timeout: apiConfig.timeouts.catalogo }
    );
    return data as unknown;
  },
  async consultarDisponibilidad(
    sku: string,
    cantidad?: number
  ): Promise<DisponibilidadPuntual[]> {
    const { data } = await http.get(`/catalogo/disponibilidad`, {
      params: cantidad == null ? { sku } : { sku, cantidad },
      timeout: apiConfig.timeouts.catalogo,
    });
    return data as DisponibilidadPuntual[];
  },
  async listarPromociones(): Promise<unknown> {
    const { data } = await http.get(`/catalogo/promociones`, {
      timeout: apiConfig.timeouts.catalogo,
    });
    return (data as { items?: unknown } | null)?.items;
  },
};
