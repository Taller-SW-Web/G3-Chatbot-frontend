/**
 * Superficie pública de mod-cart.
 * Otros módulos solo pueden importar desde aquí; nunca su domain/application/adapters.
 */
export { CartPage } from "./ui/CartPage";
export { CartDiscounts } from "./ui/CartDiscounts";
export { BloqueCarrito } from "./ui/blocks/BloqueCarrito";

export { useCarrito } from "./application/useCarrito";
export { actualizarCantidadCarritoUseCase } from "./application/actualizarCantidadCarritoUseCase";
export { agregarCarritoAnonimoUseCase } from "./application/agregarCarritoAnonimoUseCase";
export { agregarProductoAlCarritoUseCase } from "./application/agregarProductoAlCarritoUseCase";
export { aplicarCuponUseCase } from "./application/aplicarCuponUseCase";
export { listarCarritoUseCase } from "./application/listarCarritoUseCase";
export { quitarCuponUseCase } from "./application/quitarCuponUseCase";
export { quitarDelCarritoUseCase } from "./application/quitarDelCarritoUseCase";
export { vaciarCarritoUseCase } from "./application/vaciarCarritoUseCase";

export { mensajeCarrito } from "./application/errors/carritoMensajes";
export { mensajeCupon } from "./application/errors/cuponMensajes";

export type { CarritoUI } from "./domain/entities/CarritoUI";
export type { DatosCarritoBloque, LineaCarritoBloque } from "./domain/entities/DatosCarritoBloque";
export { parseCartDiscounts } from "./domain/utils/cartDiscounts";

export type {
  AgregarAlCarritoInput,
  CarritoBackend,
  CarritoPort,
  CuponAplicado,
  LineaCarritoBackend,
  ResultadoCupon,
} from "./ports/carritoPort";
