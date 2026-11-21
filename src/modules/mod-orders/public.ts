/**
 * Superficie pública de mod-orders.
 * Otros módulos solo pueden importar desde aquí; nunca su domain/application/adapters.
 */
export { OrderHistoryPage } from "./ui/OrderHistoryPage";
export { SeguimientoPage } from "./ui/SeguimientoPage";
export { ConfirmacionPedido } from "./ui/blocks/ConfirmacionPedido";
export { ListaPedidos } from "./ui/blocks/ListaPedidos";
export { EstadoPedido } from "./ui/blocks/EstadoPedido";
export { ListaReclamos } from "./ui/blocks/ListaReclamos";
export { ListaDevoluciones } from "./ui/blocks/ListaDevoluciones";
export { DeliveryRating } from "./ui/DeliveryRating";

export { reenviarConfirmacionUseCase } from "./application/reenviarConfirmacionUseCase";
export { mensajeReenvio } from "./application/errors/confirmacionMensajes";

export type {
  PaginaPedidos,
  PedidoDetalle,
  PedidoLinea,
  PedidoResumen,
  PedidosPort,
  ReenvioConfirmacion,
  SeguimientoPedido,
} from "./ports/pedidosPort";
