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

- `POST /checkout` acepta `guardarDireccion` (checkbox "Guardar esta dirección") y responde `409 CARRITO_DESACTUALIZADO` con el detalle por línea; la pantalla muestra cada cambio y el CTA "VOLVER AL CARRITO" (SPEC-10, SPEC-12).
- Ante `403 CELULAR_NO_VERIFICADO` (SPEC-04), el checkout muestra el flujo `OtpCelularFlow` de `shared/auth`, guarda `accionPendiente = INICIAR_CHECKOUT` y reintenta el checkout al verificar.
- `POST /pedidos/{pedidoId}/valoracion-compra`: `RatingPopup` guarda la valoración de compra (estrellas 1–5) en el chatbot. "Ahora no" se recuerda por pedido en `localStorage`; un `409` se trata como valoración ya registrada.

## Dependencias externas

`mod-cart` (`useCarrito`) y `mod-shipping` (`useCotizacionEnvio`, `CotizacionEnvio`), siempre por `public.ts`.

## Pruebas

- Unitarias: `tests/unit/mod_checkout/` (3 archivos)

## Reglas

- No importar `domain/`, `application/` ni `adapters/` de otro módulo.
- No tocar `shared/` sin label `cross-modulo`.
- Un PR de este módulo no modifica archivos de otro `mod-*`.
