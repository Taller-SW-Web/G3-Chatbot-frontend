# Arquitectura Frontend — Canal Chatbot (monolito modular)

> **Estado:** ADR-0024 aplicado (2026-11-21). Este documento describe el árbol
> vigente, no el corte hexagonal por capas anterior. Fuente de verdad:
> `docs/adr/ADR-0024-modularizacion.md`, `modules.manifest.json`,
> `scripts/check-modules.mjs` y el `MODULE.md` de cada módulo.

Next.js App Router con React 19 y TypeScript strict. La UI no llama a la red:
las páginas hablan con casos de uso, los casos con puertos y los adapters
implementan esos puertos a través de `shared/api`.

## 1. Reglas no negociables

1. **Corte por capacidad:** 8 módulos `mod-*` con el mismo id que el backend.
2. Un módulo solo importa `shared/`, su propio árbol y el `public.ts` de un
   módulo declarado en su `dependsOn`.
3. Prohibido importar `domain/`, `application/`, `ports/` o `adapters/` de otro
   módulo, y prohibido `container.api` dentro de `src/modules/**`.
4. `shared/` es kernel: configuración, HTTP, DI, sesión de transporte, errores,
   seguridad y primitivas UI. **No contiene reglas de negocio.**
5. `src/app/**` es el composition root: puede importar varios módulos por su
   `public.ts` y es el único lugar que conoce a la vez módulos que no se
   dependen entre sí.
6. No cambian las URLs públicas ni el comportamiento: los `page.tsx` siguen
   siendo wrappers de una página de módulo.

## 2. Árbol

```text
G3-Chatbot-frontend/
├── modules.manifest.json          # id, name, owner y dependsOn de los 8 módulos
├── scripts/
│   ├── sync-modules.mjs           # genera el registry desde los manifiestos
│   ├── check-modules.mjs          # estructura, fronteras, registry y contrato
│   └── module-boundaries.exceptions.json
├── src/
│   ├── app/                       # rutas Next: wrappers + composition roots
│   ├── shared/                    # kernel (ver src/shared/README.md)
│   └── modules/
│       ├── registry.generated.ts  # AUTO-GENERADO: no editar
│       └── mod-*/
│           ├── MODULE.md          # responsabilidad, rutas, endpoints, reglas
│           ├── module.manifest.ts # routes, nav, endpoints, dependsOn
│           ├── public.ts          # única superficie para otros módulos
│           ├── domain/            # entidades, schemas Zod, utils puros
│           ├── application/       # casos de uso y hooks de estado
│           ├── ports/             # contratos *Port.ts
│           ├── adapters/          # REST/SSE; único lugar con red del módulo
│           └── ui/                # páginas, bloques y formularios
└── tests/
    ├── unit/                      # espejo de src/modules y shared
    └── e2e/                       # Playwright
```

## 3. Los 8 módulos

| id | Responsabilidad | Rutas | `dependsOn` |
|---|---|---|---|
| `mod-auth` | sesión, registro, MFA, OTP, perfil, política de contraseña | `/cuenta`, `/verificar-correo` | — |
| `mod-catalog` | home, tarjetas, detalle, variantes, disponibilidad, promociones | `/` | — |
| `mod-cart` | carrito, items, cupón, carrito anónimo por conversación | `/carrito` | `mod-catalog` |
| `mod-shipping` | cotización de envío y direcciones | bloque en `/checkout` | — |
| `mod-checkout` | checkout, pago simulado, confirmación | `/checkout`, `/exito` | `mod-cart`, `mod-shipping` |
| `mod-orders` | pedidos, detalle, seguimiento, reenvío de confirmación | `/pedidos`, `/pedidos/[tab]`, `/pedido`, `/seguimiento` | `mod-checkout` |
| `mod-postventa` | devoluciones, reclamos, evidencias, constancias y CSAT (`DeliveryRating` + adapter) | `/devolucion`, `/reclamo` | `mod-orders` |
| `mod-chat` | turnos, SSE, historial, sidebar, bloques, sugerencias | `/chat/[id]`, `/sugerencias` | todos |

### DAG

```text
catalog ← cart ← checkout ← orders ← postventa
           ↑        ↑
        shipping ───┘
chat → todos (orquestador; ningún módulo depende de chat)
auth → usado por todos vía shared/auth
```

`mod-orders` no conoce `mod-postventa`: las pestañas de devoluciones y reclamos
se inyectan como slots desde `app/pedidos/page.tsx`, y el CSAT como `csatSlot`
desde `app/pedido/page.tsx`. `mod-postventa` es el dueño canónico del CSAT
(decisión #186): `DeliveryRating` y `calificarPedido` viven en su `ui/` y su
adapter; `mod-orders` solo expone el detalle y decide cuándo mostrar el slot
(`ENTREGADO` y `!csatEnviado`). `mod-postventa` consume `pedidosPort` del
`public.ts` de `mod-orders` y el perfil con `usePerfil` de `shared/auth`.

## 4. Fronteras que verifica `pnpm modules:check`

| Regla | Qué rechaza |
|---|---|
| Estructura | falta `MODULE.md`, `module.manifest.ts`, `public.ts`, `ui/`, `ports/` o `adapters/`; falta un `*Port.ts`; no hay adapter |
| Manifiestos | ids desparejos con las carpetas; `name`/`owner`/`dependsOn` distintos del manifiesto central; dependencia inexistente |
| Registry | `src/modules/registry.generated.ts` desactualizado |
| Import profundo | un módulo importa `mod-x/domain`, `/application`, `/ports` o `/adapters` |
| DAG | import o `container.<alias>` de un módulo que no está en `dependsOn` |
| Escape hatch | `container.api` dentro de `src/modules/**` |
| Dinámicos | `import()` con un argumento que no es string literal |
| Kernel | `shared/` o `app/` entran a un módulo por dentro (salvo excepción declarada) |
| Legacy | quedan `src/{adapters,application,domain,ports,infrastructure}/` |
| Contrato | un endpoint del manifiesto no existe en el `openapi.json` o su tag no es el id del módulo |

### Excepciones

Viven en `scripts/module-boundaries.exceptions.json`; el script no tiene
excepciones hardcodeadas.

- `moduleEdges`: arista `from → to` permitida pese al DAG (hoy vacío).
- `sharedPrivateImports`: archivos de `shared/`/`app/` que pueden entrar por
  dentro a un módulo. Solo `src/shared/di/container.ts` (composition root).
- `contractPending`: endpoints que el backend todavía no publica
  (`TODO(H-17)` para el OTP de celular).
- `contractTagExceptions`: endpoints cuyo tag del openapi no coincide con el
  módulo dueño (hoy vacío: `POST /pedidos/{pedidoId}/csat` está declarado en
  `mod-postventa` y el backend ya lo etiqueta así, decisión #186).
- Toda entrada temporal lleva `todo` y `reviewBy`; el checker falla cuando la
  fecha vence.

## 5. Wrappers de `app/` (composition root)

| Ruta | Archivo | Compone |
|---|---|---|
| `/` | `app/page.tsx` (client) | `AppShell` + `HomePage` + `useHomeActions` (catálogo + carrito + chat) |
| `/carrito` | `app/carrito/page.tsx` | `AppShell` + `CartPage` |
| `/checkout` | `app/checkout/page.tsx` | `AppShell` + `CheckoutPage` |
| `/exito` | `app/exito/page.tsx` | `AppShell` + `OrderSuccessPage` |
| `/pedidos` | `app/pedidos/page.tsx` | `AppShell` + `AuthGuard` + `OrderHistoryPage` + slots de `mod-postventa` |
| `/pedidos/[tab]` | `app/pedidos/[tab]/page.tsx` | igual, con pestaña inicial validada |
| `/pedido` | `app/pedido/page.tsx` (Server Component) + `app/pedido/PedidoContent.tsx` (client) | `AppShell` + `AuthGuard` + `Suspense` + `OrderDetailPage` + `DeliveryRating` de `mod-postventa` como `csatSlot`; el composition root cliente refresca `["pedido", pedidoId]` ante `ORDER_NOT_DELIVERED` |
| `/seguimiento` | `app/seguimiento/page.tsx` | `AppShell` + `AuthGuard` + `SeguimientoPage` |
| `/devolucion` | `app/devolucion/page.tsx` | `AppShell` + `AuthGuard` + `Suspense` + `DevolucionPage` |
| `/reclamo` | `app/reclamo/page.tsx` | `AppShell` + `AuthGuard` + `Suspense` + `ReclamoPage` |
| `/chat/[id]` | `app/chat/[id]/page.tsx` | `AppShell` + `ChatPage` |
| `/sugerencias` | `app/sugerencias/page.tsx` | `AppShell` + `SugerenciasPage` |
| `/cuenta` | `app/cuenta/page.tsx` | `AppShell` + `MiCuentaPage` |
| `/verificar-correo` | `app/verificar-correo/page.tsx` | `AppShell` + `VerificarCorreoPage` |

`AppShell` es el chrome único (header, carrito, sidebar y modal de acceso). Vive
en `shared/ui/shell` y compone módulos por su `public.ts`; está documentado en
`src/shared/README.md`.

## 6. Capas dentro de un módulo

| Capa | Sí | No |
|---|---|---|
| `domain/` | entidades, tipos, schemas Zod, reglas puras | React, red, `localStorage` |
| `application/` | casos de uso, hooks, estado del módulo | JSX, Axios, `fetch` |
| `ports/` | interfaces del contrato REST/SSE | implementaciones |
| `adapters/` | Axios/SSE con `shared/api`; mapeo wire → UI | reglas de negocio |
| `ui/` | páginas, bloques, formularios; consumen casos de uso | importar adapters de otro módulo |
| `public.ts` | lo que otros módulos pueden usar | exports internos |

Un módulo puede exponer un **puerto cableado** (`pedidosPort`) cuando otro
módulo necesita una operación sin duplicar el adapter.

## 7. Contrato backend ↔ frontend

- Cada `module.manifest.ts` declara `endpoints` (paths sin `/api/v1`).
- `check-modules.mjs` lee `OPENAPI_PATH` (default
  `../G3-Chatbot-backend/docs/openapi.json`), normaliza `/api/v1` y los nombres
  de parámetros (`{pedidoId}` ≡ `{pedido_id}`) y exige:
  1. el path existe en `openapi.json`;
  2. al menos una operación lleva `tags: ["mod-<id>"]`.
- Si el backend no está clonado, el contrato se omite con aviso. Si
  `OPENAPI_PATH` está definido y no existe, falla.
- El CSAT (`POST /pedidos/{pedidoId}/csat`) se declara en el manifiesto de
  `mod-postventa`, no en el de `mod-orders`.
- Los endpoints de OTP pendientes están en la allowlist del JSON con `reviewBy`;
  al vencer, el gate falla.

## 8. Manifiestos y registry

- `modules.manifest.json`: fuente central de `id`, `name`, `owner` y
  `dependsOn`.
- `src/modules/<id>/module.manifest.ts`: `routes`, `nav`, `endpoints` y
  `dependsOn` (debe coincidir con el central).
- `pnpm modules:sync` regenera `src/modules/registry.generated.ts`.
- `pnpm modules:check` falla si el registry quedó desactualizado.
- Añadir un módulo = crear la carpeta con sus capas + `MODULE.md` +
  `module.manifest.ts` + `public.ts`, añadirlo al manifiesto central y correr
  `modules:sync`. Nadie edita una lista compartida a mano.

## 9. Gates

Se ejecutan en cada PR; todos bloquean:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm build
pnpm modules:check
```

`pnpm modules:check` incluye estructura, fronteras, registry y contrato. En CI
sin el repo del backend se define `OPENAPI_PATH` o se acepta el aviso de
contrato omitido.

## 10. Flujo de una feature

1. Lee el `MODULE.md` y la spec del módulo antes de tocar código.
2. Si el cambio no está en la spec, abre una issue en `G3-Chatbot-specs`
   asignada a `@Ankarmin` y `@MathiasTL`; no abras ramas ni PRs en specs.
3. Revisa coherencia con lo existente (nombres, errores por `code`, estados).
4. Un PR por módulo; `shared/` va aparte con label `cross-modulo`.
5. Verifica los gates de la sección 9 y el contrato.

Detalle operativo en `docs/flujo-de-trabajo.md`.

## 11. Pruebas

- `tests/unit/mod_*/` replica cada módulo; `tests/unit/shared/` cubre kernel y
  checker (`checkModules.test.ts`).
- Los flujos de composición se prueban donde viven: `homeActions.test.tsx`
  (carrito + chat inyectados en la home), `orderHistoryPage.test.tsx` (slots de
  postventa).
- `tests/e2e/` usa Playwright contra la app real.
- No se borran tests al mover código: se mueven con el flujo.

## 12. Errores comunes

- Importar un módulo por dentro “porque solo es un tipo”: usa `public.ts`.
- Llamar `container.api` desde una página: usa `container.<alias>` propio o el
  port público del módulo declarado.
- Poner una regla de negocio en `shared/`: pertenece a un `mod-*`.
- Editar el registry a mano: se regenera con `modules:sync`.
- Añadir un endpoint al manifiesto sin el tag correcto en el backend: el gate
  de contrato lo rechaza (o exige una excepción con fecha).
