/**
 * Superficie pública de mod-catalog.
 * Otros módulos solo pueden importar desde aquí; nunca su domain/application/adapters.
 */
export { HomePage } from "./ui/HomePage";
export type { HomeAgregarInput, HomeAgregarResultado, HomePageProps } from "./ui/HomePage";
export { ProductCard } from "./ui/ProductCard";
export { AvailabilityBadge } from "./ui/AvailabilityBadge";
export { ProductImage } from "./ui/ProductImage";
export { PriceTag } from "./ui/PriceTag";
export { CarruselProductos } from "./ui/blocks/CarruselProductos";
export {
  DetalleProducto,
  ProductDetailModal,
  ModalShell,
  XClose,
  colorSwatch,
} from "./ui/blocks/DetalleProducto";
export type { ConsultarDisponibilidad } from "./ui/blocks/DetalleProducto";
export { SelectorVariante } from "./ui/blocks/SelectorVariante";
export { ListaPromociones } from "./ui/blocks/ListaPromociones";

export * from "./domain/entities/CatalogoUI";
export * from "./domain/entities/PromocionesUI";

export { buscarProductosUseCase } from "./application/buscarProductosUseCase";
export { verDetalleProductoUseCase } from "./application/verDetalleProductoUseCase";
export { consultarDisponibilidadUseCase } from "./application/consultarDisponibilidadUseCase";

export type {
  BuscarProductosInput,
  CatalogoPort,
  DisponibilidadPuntual,
  PaginaCatalogo,
} from "./ports/catalogoPort";
