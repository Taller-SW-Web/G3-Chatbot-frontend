"use client";

import { http } from "@/shared/api/http";
import { apiConfig } from "@/shared/config/apiConfig";
import type {
  AgregarAlCarritoInput,
  CarritoBackend,
  CarritoPort,
  ResultadoCupon,
} from "@/modules/mod-cart/ports/carritoPort";

/**
 * Adapter REST del carrito y cupones (SPEC-10, SPEC-11, SPEC-13).
 * Los errores problem+json los ramifica la UI por `code`.
 */
export const carritoApi: CarritoPort = {
  async agregarAlCarrito(input, conversacionId?: string) {
    // SPEC-09 Req. 2 "agregar desde la tarjeta": endpoint real del carrito.
    // conversacionId ubica el carrito anónimo; sin él solo funciona el de cliente.
    // Se envían product_id/talla/color cuando la tarjeta los conoce para que la
    // línea conserve nombre, imagen e id reales (sin inventar nada en el front).
    const body: Record<string, unknown> = {
      sku: input.sku,
      cantidad: input.cantidad,
    };
    if (input.product_id) body.product_id = input.product_id;
    if (input.talla) body.talla = input.talla;
    if (input.color) body.color = input.color;
    const { data } = await http.post(`/carrito/items`, body, {
      params: conversacionId ? { conversacionId } : undefined,
      timeout: apiConfig.timeouts.catalogo,
    });
    const carrito =
      (data as { carrito?: CarritoBackend }).carrito ?? (data as CarritoBackend);
    return { ok: true as const, carrito: carrito?.lineas ? carrito : undefined };
  },
  async listarCarrito(conversacionId?: string): Promise<CarritoBackend> {
    const { data } = await http.get(`/carrito`, {
      params: conversacionId ? { conversacionId } : undefined,
      timeout: apiConfig.timeouts.catalogo,
    });
    return data as CarritoBackend;
  },
  async actualizarCantidadCarrito(itemId: string, cantidad: number, conversacionId?: string): Promise<CarritoBackend> {
    const { data } = await http.patch(
      `/carrito/items/${encodeURIComponent(itemId)}`,
      { cantidad },
      {
        params: conversacionId ? { conversacionId } : undefined,
        timeout: apiConfig.timeouts.catalogo,
      }
    );
    return (data as { carrito: CarritoBackend }).carrito ?? (data as CarritoBackend);
  },
  async eliminarLineaCarrito(itemId: string, conversacionId?: string): Promise<{ mensaje: string }> {
    const { data } = await http.delete(
      `/carrito/items/${encodeURIComponent(itemId)}`,
      {
        params: conversacionId ? { conversacionId } : undefined,
        timeout: apiConfig.timeouts.catalogo,
      }
    );
    return data as { mensaje: string };
  },
  async vaciarCarrito(conversacionId?: string): Promise<{ mensaje: string }> {
    const { data } = await http.delete(`/carrito`, {
      params: conversacionId ? { conversacionId } : undefined,
      data: { confirmado: true },
      timeout: apiConfig.timeouts.catalogo,
    });
    return data as { mensaje: string };
  },
  // Cupones (SPEC-13): el backend valida contra Productos sin consumirlos y
  // devuelve el carrito recalculado. Requieren sesión de cliente.
  async aplicarCupon(
    codigo: string,
    confirmarReemplazo = false
  ): Promise<ResultadoCupon> {
    const { data } = await http.post(
      `/carrito/cupon`,
      { codigo, confirmarReemplazo },
      { timeout: apiConfig.timeouts.catalogo }
    );
    return data as ResultadoCupon;
  },
  async quitarCupon(): Promise<ResultadoCupon> {
    const { data } = await http.delete(`/carrito/cupon`, {
      timeout: apiConfig.timeouts.catalogo,
    });
    return data as ResultadoCupon;
  },
};
