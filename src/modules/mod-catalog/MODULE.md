# `mod-catalog` — Catálogo

- **Owner:** @SOoOnny
- **Frontend:** carpeta `mod-catalog`, rutas `[/]`
- **Depende de:** ninguno (ver excepciones de frontera)
- **Contrato:** `/catalogo/*`

## Responsabilidad

Home con ofertas, tarjetas de producto, detalle, variantes, disponibilidad y promociones. No incluye el carrito ni la conversación.

## Superficie pública

| Tipo | Archivo | Qué expone |
|---|---|---|
| Frontend | `public.ts` | `HomePage`, `ProductCard`, `DetalleProducto`, `CarruselProductos`, `SelectorVariante`, `ListaPromociones`, helpers de `CatalogoUI`/`PromocionesUI` y casos de uso |

## Rutas

| Método | Ruta | Caso de uso |
|---|---|---|
| GET | `/` | Banner de ofertas, grid y detalle de producto |

## Endpoints

`GET /catalogo/productos`, `GET /catalogo/productos/{productId}`, `GET /catalogo/disponibilidad`.

## Dependencias externas

Ninguna.

## Excepciones de frontera

`ui/HomePage.tsx` importa `mod-cart/public` y `mod-chat/public` para que la tarjeta agregue al carrito y el compositor abra la conversación. El DAG declara `cart → catalog` y `chat → catalog`, así que esta arista inversa está registrada en `scripts/module-boundaries.exceptions.json`; la corrección (slots de carrito/chat inyectados desde `app/page.tsx`) queda para Fase 4.

## Pruebas

- Unitarias: `tests/unit/mod_catalog/` (7 archivos)

## Reglas

- No importar `domain/`, `application/` ni `adapters/` de otro módulo.
- No tocar `shared/` sin label `cross-modulo`.
- Un PR de este módulo no modifica archivos de otro `mod-*`.
