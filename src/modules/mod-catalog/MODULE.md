# `mod-catalog` — Catálogo

- **Owner:** @Taller-SW-Web/chatbot
- **Frontend:** carpeta `mod-catalog`, rutas `[/]`
- **Depende de:** ninguno
- **Contrato:** `/catalogo/*`

## Responsabilidad

Home con ofertas, tarjetas de producto, detalle, variantes, disponibilidad y promociones. No incluye el carrito ni la conversación.

## Superficie pública

| Tipo | Archivo | Qué expone |
|---|---|---|
| Frontend | `public.ts` | `HomePage` (+ `HomePageProps`/`HomeAgregarInput`), `ProductCard`, `DetalleProducto`, `CarruselProductos`, `SelectorVariante`, `ListaPromociones`, helpers de `CatalogoUI`/`PromocionesUI` y casos de uso |

## Rutas

| Método | Ruta | Caso de uso |
|---|---|---|
| GET | `/` | Banner de ofertas, selector de orden, grid y detalle de producto |

## Endpoints

`GET /catalogo/productos`, `GET /catalogo/productos/{productId}`, `GET /catalogo/disponibilidad`, `GET /catalogo/promociones` (banner de la home).

El grid de la home acepta `orden` (`relevancia`, `precio_asc`, `precio_desc`, `nombre_asc`, `nombre_desc`) mediante `SelectorOrden`; `relevancia` es el valor por defecto y no se envía al backend.

## Dependencias externas

Ninguna.

## Composición

`HomePage` no conoce el carrito ni el chat: recibe `onAgregar`, `onAbrirChat` y
`mensajeMaxCaracteres`. El composition root `app/page.tsx` los cablea con
`useHomeActions` (carrito, conversación anónima y navegación al chat). Sin
excepciones de frontera.

## Pruebas

- Unitarias: `tests/unit/mod_catalog/` (7 archivos)

## Reglas

- No importar `domain/`, `application/` ni `adapters/` de otro módulo.
- No tocar `shared/` sin label `cross-modulo`.
- Un PR de este módulo no modifica archivos de otro `mod-*`.
