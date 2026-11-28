# `mod-postventa` — Postventa

- **Owner:** @Taller-SW-Web/chatbot
- **Frontend:** carpeta `mod-postventa`, rutas `[/devolucion, /reclamo]`
- **Depende de:** `mod-orders`
- **Contrato:** `/devoluciones/*`, `/reclamos/*`, `/evidencias`, `POST /pedidos/{pedidoId}/csat`

## Responsabilidad

Solicitudes de cambio/devolución con evidencias, Libro de Reclamaciones (reclamos y quejas), constancias, estados y CSAT de la entrega. No incluye el historial de pedidos: lo consume desde `mod-orders`. El CSAT no tiene ruta propia: `app/pedido/page.tsx` inyecta `DeliveryRating` como `csatSlot` de `OrderDetailPage`, solo para pedidos `ENTREGADO` sin calificar.

## Superficie pública

| Tipo | Archivo | Qué expone |
|---|---|---|
| Frontend | `public.ts` | `DevolucionPage`, `ReclamoPage`, `HistorialDevoluciones`, `HistorialReclamos`, `ListaDevoluciones`, `ListaReclamos`, `DeliveryRating` (+ `puntuacionDeMood`, `DeliveryMood`), formularios, constancias/estados y tipos del contrato |

Los bloques de postventa se adaptan al `datos` del delta M5: `respuestaVisibleCliente` y
`resolucion.fundamento` se muestran textualmente y el reembolso solo se pinta cuando
`resolucion.reembolso` existe. Sus tipos se publican para `mod-chat`.

## Rutas

| Método | Ruta | Caso de uso |
|---|---|---|
| GET | `/devolucion` | Registrar devolución/cambio con evidencia |
| GET | `/reclamo` | Registrar reclamo o queja |

El CSAT se muestra dentro de `/pedido` como slot inyectado; no registra una ruta propia.

## Endpoints

`POST /evidencias`, `POST /devoluciones`, `GET /devoluciones`, `GET /devoluciones/{devolucionId}`, `POST /reclamos`, `GET /reclamos`, `GET /reclamos/{codigoSeguimiento}`, `POST /pedidos/{pedidoId}/csat`.

- `409 RECLAMO_DUPLICADO` y `409 DEVOLUCION_DUPLICADA`: la pantalla muestra el código existente y el botón "Registrar igual", que reenvía la misma solicitud con `forzar: true`. La evidencia ya subida se reutiliza (no se sube dos veces).
- CSAT: `409 CSAT_ALREADY_SUBMITTED` muestra "Ya calificaste este pedido"; `422 ORDER_NOT_DELIVERED` avisa que solo se califican pedidos entregados y pide refrescar el detalle.

## Dependencias externas

`mod-orders`: `DevolucionPage` consulta el pedido con `pedidosPort` de su
`public.ts`. El perfil del reclamante se lee con `usePerfil` de `shared/auth`
(sin arista hacia `mod-auth`).

## Pruebas

- Unitarias: `tests/unit/mod_postventa/` (10 archivos)

## Reglas

- No importar `domain/`, `application/` ni `adapters/` de otro módulo.
- No tocar `shared/` sin label `cross-modulo`.
- Un PR de este módulo no modifica archivos de otro `mod-*`.
