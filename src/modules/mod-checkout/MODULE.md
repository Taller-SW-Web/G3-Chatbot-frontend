# `mod-checkout` — Checkout y pago

- **Owner:** @MathiasTL
- **Frontend:** carpeta `mod-checkout`, rutas `[/checkout, /exito]`
- **Depende de:** `mod-cart`, `mod-shipping`
- **Contrato:** `/checkout/*`

## Responsabilidad

Checkout en dos pasos (dirección → tarjeta), temporizador de 15 minutos, intentos de pago, resumen y pantalla de éxito. No incluye el carrito ni la cotización: los consume por `public.ts`.

## Superficie pública

| Tipo | Archivo | Qué expone |
|---|---|---|
| Frontend | `public.ts` | `CheckoutPage`, `OrderSuccessPage`, `ResumenCheckout`, `RatingPopup`, tipos del contrato |

## Rutas

| Método | Ruta | Caso de uso |
|---|---|---|
| GET | `/checkout` | Dirección, cotización, pago simulado |
| GET | `/exito` | Confirmación y calificación del pedido |

## Endpoints

`POST /checkout`, `GET /checkout/{checkoutId}`, `POST /checkout/{checkoutId}/pago`.

## Dependencias externas

`mod-cart` (`useCarrito`) y `mod-shipping` (`useCotizacionEnvio`, `CotizacionEnvio`), siempre por `public.ts`.

## Pruebas

- Unitarias: `tests/unit/mod_checkout/` (3 archivos)

## Reglas

- No importar `domain/`, `application/` ni `adapters/` de otro módulo.
- No tocar `shared/` sin label `cross-modulo`.
- Un PR de este módulo no modifica archivos de otro `mod-*`.
