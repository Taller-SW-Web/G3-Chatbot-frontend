# `mod-cart` — Carrito

- **Owner:** @SOoOnny
- **Frontend:** carpeta `mod-cart`, rutas `[/carrito]`
- **Depende de:** `mod-catalog`
- **Contrato:** `/carrito/*`

## Responsabilidad

Líneas del carrito, cantidades, cupón, totales, bloque `CARRITO` del chat, el hook `useCarrito` del badge y la resolución del carrito anónimo por conversación (`conversacionParaCarrito`). No incluye el pago ni el envío.

## Superficie pública

| Tipo | Archivo | Qué expone |
|---|---|---|
| Frontend | `public.ts` | `CartPage`, `BloqueCarrito`, `useCarrito`, `conversacionParaCarrito`, casos de uso de carrito/cupón, `mensajeCarrito`, `parseCartDiscounts`, tipos del wire |

## Rutas

| Método | Ruta | Caso de uso |
|---|---|---|
| GET | `/carrito` | Ver líneas, cambiar cantidades, aplicar cupón, ir a pagar |

## Endpoints

`GET /carrito`, `POST /carrito/items`, `PATCH|DELETE /carrito/items/{itemId}`, `POST|DELETE /carrito/cupon`.

## Dependencias externas

`mod-catalog` (tipos y piezas de presentación: `PriceTag`, `ProductImage`, `PromocionesUI`), siempre por `public.ts`.

## Pruebas

- Unitarias: `tests/unit/mod_cart/` (8 archivos)

## Reglas

- No importar `domain/`, `application/` ni `adapters/` de otro módulo.
- No tocar `shared/` sin label `cross-modulo`.
- Un PR de este módulo no modifica archivos de otro `mod-*`.
