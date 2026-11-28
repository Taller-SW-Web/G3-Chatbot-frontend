# `mod-shipping` — Envío

- **Owner:** @Taller-SW-Web/chatbot
- **Frontend:** carpeta `mod-shipping`, sin ruta propia
- **Depende de:** `mod-cart`
- **Contrato:** `POST /envio/cotizar`

## Responsabilidad

Cotización de envío por distrito y el bloque visual que la muestra dentro de `/checkout`. No incluye la dirección ni el pago (son de `mod-checkout`).

## Superficie pública

| Tipo | Archivo | Qué expone |
|---|---|---|
| Frontend | `public.ts` | `useCotizacionEnvio`, `CotizacionEnvio` (bloque), `cotizarEnvioUseCase`, `mensajeCotizacion`, `DireccionCotizable` |

## Rutas

| Método | Ruta | Caso de uso |
|---|---|---|
| — | — | Bloque embebido en `/checkout` |

## Endpoints

`POST /envio/cotizar`.

## Dependencias externas

`mod-cart` (declarada en el manifiesto): la cotización se invalida con la firma
de las líneas del carrito (`firmaCarritoEnvio`), aunque el módulo recibe esas
líneas por tipo estructural y hoy no importa su `public.ts`. `useCotizacionEnvio`
acepta el tipo `DireccionCotizable`, de modo que `mod-checkout` puede pasarle su
formulario sin que este módulo lo importe.

## Pruebas

- Unitarias: `tests/unit/mod_shipping/` (2 archivos)

## Reglas

- No importar `domain/`, `application/` ni `adapters/` de otro módulo.
- No tocar `shared/` sin label `cross-modulo`.
- Un PR de este módulo no modifica archivos de otro `mod-*`.
