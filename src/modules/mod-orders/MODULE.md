# `mod-orders` — Pedidos y seguimiento

- **Owner:** @MathiasTL
- **Frontend:** carpeta `mod-orders`, rutas `[/pedidos, /pedidos/[tab], /seguimiento]`
- **Depende de:** `mod-checkout`
- **Contrato:** `/pedidos/*`

## Responsabilidad

Historial de pedidos por estado, detalle, seguimiento del despacho, reenvío de confirmación y calificación de entrega. Incluye las vistas de solo lectura de reclamos y devoluciones que aparecen en las pestañas de historial; su creación vive en `mod-postventa`.

## Superficie pública

| Tipo | Archivo | Qué expone |
|---|---|---|
| Frontend | `public.ts` | `OrderHistoryPage`, `SeguimientoPage`, `ConfirmacionPedido`, `ListaPedidos`, `EstadoPedido`, `ListaReclamos`, `ListaDevoluciones`, casos de uso y tipos |

## Rutas

| Método | Ruta | Caso de uso |
|---|---|---|
| GET | `/pedidos` | Historial por pestañas |
| GET | `/pedidos/[tab]` | Historial filtrado por estado |
| GET | `/seguimiento` | Hitos del despacho |

## Endpoints

`GET /pedidos`, `GET /pedidos/{pedidoId}`, `GET /pedidos/{pedidoId}/seguimiento`, `POST /pedidos/{pedidoId}/csat`, `POST /pedidos/{pedidoId}/reenviar-confirmacion`.

## Dependencias externas

`mod-checkout` (declarada en el manifiesto; hoy solo comparte tipos de pedido). No importa módulos por dentro.

## Pruebas

- Unitarias: `tests/unit/mod_orders/` (4 archivos)

## Reglas

- No importar `domain/`, `application/` ni `adapters/` de otro módulo.
- No tocar `shared/` sin label `cross-modulo`.
- Un PR de este módulo no modifica archivos de otro `mod-*`.
