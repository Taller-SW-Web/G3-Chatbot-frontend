# `mod-shipping` — Envío

- **Owner:** @Taller-SW-Web/chatbot
- **Frontend:** carpeta `mod-shipping`, sin ruta propia
- **Depende de:** ninguno
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

Ninguna. `useCotizacionEnvio` acepta el tipo estructural `DireccionCotizable`, de modo que `mod-checkout` puede pasarle su formulario sin que este módulo lo importe.

## Pruebas

- Unitarias: `tests/unit/mod_shipping/` (1 archivo)

## Reglas

- No importar `domain/`, `application/` ni `adapters/` de otro módulo.
- No tocar `shared/` sin label `cross-modulo`.
- Un PR de este módulo no modifica archivos de otro `mod-*`.
