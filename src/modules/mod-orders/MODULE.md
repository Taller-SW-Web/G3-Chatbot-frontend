# `mod-orders` — Pedidos y seguimiento

- **Owner:** @Taller-SW-Web/chatbot
- **Frontend:** carpeta `mod-orders`, rutas `[/pedidos, /pedidos/[tab], /pedido, /seguimiento]`
- **Depende de:** `mod-checkout`
- **Contrato:** `/pedidos/*`

## Responsabilidad

Historial de pedidos por estado, detalle, seguimiento del despacho, reenvío de confirmación y calificación de entrega (CSAT) únicamente al pie del detalle de un pedido `ENTREGADO`, nunca en la lista. Las pestañas de devoluciones y reclamos se inyectan como slots desde `app/pedidos/page.tsx` con componentes de `mod-postventa`; su creación también vive ahí.

## Superficie pública

| Tipo | Archivo | Qué expone |
|---|---|---|
| Frontend | `public.ts` | `OrderHistoryPage` (+ `OrderHistorySlots`), `OrderDetailPage`, `SeguimientoPage`, `ConfirmacionPedido`, `ListaPedidos`, `EstadoPedido`, `pedidosPort`, casos de uso y tipos |

## Rutas

| Método | Ruta | Caso de uso |
|---|---|---|
| GET | `/pedidos` | Historial por pestañas |
| GET | `/pedidos/[tab]` | Historial filtrado por estado |
| GET | `/pedido?pedidoId=` | Detalle del pedido con CSAT al pie |
| GET | `/seguimiento` | Hitos del despacho |

## Endpoints

`GET /pedidos`, `GET /pedidos/{pedidoId}`, `GET /pedidos/{pedidoId}/seguimiento`, `POST /pedidos/{pedidoId}/csat`, `POST /pedidos/{pedidoId}/reenviar-confirmacion`.

## Dependencias externas

`mod-checkout` (declarada en el manifiesto; hoy solo comparte tipos de pedido). Expone `pedidosPort` para que `mod-postventa` consulte el pedido sin tocar el adapter.

## Pruebas

- Unitarias: `tests/unit/mod_orders/` (7 archivos)

## Reglas

- No importar `domain/`, `application/` ni `adapters/` de otro módulo.
- No tocar `shared/` sin label `cross-modulo`.
- Un PR de este módulo no modifica archivos de otro `mod-*`.
