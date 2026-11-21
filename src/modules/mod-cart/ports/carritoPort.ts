/** Contrato REST del carrito (SPEC-10, SPEC-11, SPEC-13). */

/** Línea del carrito tal como la expone `GET /carrito` (contratos §2.4). */
export type LineaCarritoBackend = {
  item_id: string;
  sku: string;
  nombre: string;
  variante?: string | null;
  cantidad: number;
  precio: number;
  disponible: boolean;
  imagen?: string | null;
  nota?: string | null;
};

/** Carrito con totales recalculados (SPEC-11 Req. 3). Precios desde herramientas. */
export type CarritoBackend = {
  lineas: LineaCarritoBackend[];
  subtotal: number;
  descuentos: { nombre: string; monto: number }[];
  costoEnvio: number | null;
  envio?: string | null;
  total: number;
  avisos: string[];
  promociones_ok?: boolean;
};

/** Cupón aplicado al carrito (`POST /carrito/cupon`, SPEC-13). */
export type CuponAplicado = {
  codigo: string;
  descuento: number;
  moneda: string;
  promocionId?: string | null;
};

/** Respuesta de aplicar/quitar cupón: mensaje, cupón y carrito recalculado. */
export type ResultadoCupon = {
  mensaje: string;
  cupon: CuponAplicado | null;
  carrito: CarritoBackend;
};

/** Entrada de `POST /carrito/items`. `product_id`/`talla`/`color` completan la línea. */
export type AgregarAlCarritoInput = {
  sku: string;
  cantidad: number;
  product_id?: string;
  talla?: string;
  color?: string;
};

export interface CarritoPort {
  agregarAlCarrito(input: AgregarAlCarritoInput, conversacionId?: string): Promise<{ ok: true; carrito?: CarritoBackend }>;
  /** Carrito con datos reales (SPEC-10, SPEC-11). Sin mocks. Errores por `code`. */
  listarCarrito(conversacionId?: string): Promise<CarritoBackend>;
  actualizarCantidadCarrito(itemId: string, cantidad: number, conversacionId?: string): Promise<CarritoBackend>;
  eliminarLineaCarrito(itemId: string, conversacionId?: string): Promise<{ mensaje: string }>;
  vaciarCarrito(conversacionId?: string): Promise<{ mensaje: string }>;
  /** SPEC-13: valida y aplica el cupón (requiere sesión); no lo consume. */
  aplicarCupon(codigo: string, confirmarReemplazo?: boolean): Promise<ResultadoCupon>;
  /** SPEC-13: quita el cupón y recalcula los totales. */
  quitarCupon(): Promise<ResultadoCupon>;
}
