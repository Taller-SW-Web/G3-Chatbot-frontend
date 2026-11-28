# `mod-orders` — Pedidos y seguimiento

- **Owner:** @Taller-SW-Web/chatbot
- **Frontend:** carpeta `mod-orders`, rutas `[/pedidos, /pedidos/[tab], /pedido, /seguimiento]`
- **Depende de:** `mod-checkout`
- **Contrato:** `GET /pedidos`, `GET /pedidos/{pedidoId}`, `GET /pedidos/{pedidoId}/seguimiento`, `POST /pedidos/{pedidoId}/reenviar-confirmacion`

## Responsabilidad

Historial de pedidos por estado, detalle, seguimiento del despacho y reenvío de confirmación. El CSAT de la entrega es de `mod-postventa`: se inyecta como slot (`csatSlot`) desde `app/pedido/page.tsx` solo cuando el pedido está `ENTREGADO` y `csatEnviado` es falso, así que `mod-orders` no conoce `mod-postventa`. Las pestañas de devoluciones y reclamos se inyectan igual desde `app/pedidos/page.tsx`.

## Superficie pública

| Tipo | Archivo | Qué expone |
|---|---|---|
| Frontend | `public.ts` | `OrderHistoryPage` (+ `OrderHistorySlots`), `OrderDetailPage` (+ `csatSlot`), `SeguimientoPage`, `ConfirmacionPedido`, `ListaPedidos`, `EstadoPedido`, `pedidosPort`, casos de uso y tipos |

Los bloques `ListaPedidos` y `EstadoPedido` siguen el contrato de `datos` del delta M5
(`pedidoId`, `fecha`, `total`, `estado`, `estadoEtiqueta`, `canal`; `hitos` y `seguimiento`), y sus
tipos se publican para que `mod-chat` los use sin importar el interior del módulo.

## Rutas

| Método | Ruta | Caso de uso |
|---|---|---|
| GET | `/pedidos` | Historial por pestañas |
| GET | `/pedidos/[tab]` | Historial filtrado por estado |
| GET | `/pedido?pedidoId=` | Detalle del pedido; el CSAT se inyecta como slot |
| GET | `/seguimiento` | Hitos del despacho |

## Endpoints

`GET /pedidos`, `GET /pedidos/{pedidoId}`, `GET /pedidos/{pedidoId}/seguimiento`, `POST /pedidos/{pedidoId}/reenviar-confirmacion`.

`POST /pedidos/{pedidoId}/csat` pertenece a `mod-postventa` desde la decisión #186.

## Dependencias externas

`mod-checkout` (declarada en el manifiesto; hoy solo comparte tipos de pedido). Expone `pedidosPort` para que `mod-postventa` consulte el pedido sin tocar el adapter.

## Pruebas

- Unitarias: `tests/unit/mod_orders/` (8 archivos)

## Reglas

- No importar `domain/`, `application/` ni `adapters/` de otro módulo.
- No tocar `shared/` sin label `cross-modulo`.
- Un PR de este módulo no modifica archivos de otro `mod-*`.
