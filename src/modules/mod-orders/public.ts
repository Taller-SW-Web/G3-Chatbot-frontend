/**
 * Superficie pública de mod-orders.
 * Otros módulos solo pueden importar desde aquí; nunca su domain/application/adapters.
 */
export { OrderHistoryPage } from "./ui/OrderHistoryPage";
export type { OrderHistorySlots } from "./ui/OrderHistoryPage";
export { OrderDetailPage } from "./ui/OrderDetailPage";
export { SeguimientoPage } from "./ui/SeguimientoPage";
export { ConfirmacionPedido } from "./ui/blocks/ConfirmacionPedido";
export { ListaPedidos } from "./ui/blocks/ListaPedidos";
export { EstadoPedido } from "./ui/blocks/EstadoPedido";
export { DeliveryRating } from "./ui/DeliveryRating";

export type {
  EnvioBloque,
  HitoPedido,
  HitoSeguimiento,
  ItemPedidoBloque,
  PedidoBloqueDetalle,
  PedidoBloqueResumen,
  SeguimientoBloque,
} from "./ui/blocks/tipos";

export { reenviarConfirmacionUseCase } from "./application/reenviarConfirmacionUseCase";
export { mensajeReenvio } from "./application/errors/confirmacionMensajes";

/** Puerto cableado de pedidos: otros módulos lo consumen sin tocar el adapter. */
export { pedidosApi as pedidosPort } from "./adapters/pedidosApi";

export type {
  PaginaPedidos,
  PedidoDetalle,
  PedidoEnvio,
  PedidoLinea,
  PedidoResumen,
  PedidosPort,
  ReenvioConfirmacion,
  SeguimientoPedido,
} from "./ports/pedidosPort";
