# G3 Chatbot Frontend

Frontend de Next.js del canal chatbot. La arquitectura está descrita en `arquitectura-frontend.md` y el corte por capacidad en `docs/adr/ADR-0024-modularizacion.md`.

## Estructura (ADR-0024)

- `src/shared/` — kernel: api/http, auth/sesión, config, DI, testing y primitivas UI. Sin reglas de negocio.
- `src/modules/mod-*/` — 8 módulos por capacidad (`domain`, `application`, `ports`, `adapters`, `ui`) con `MODULE.md`, `module.manifest.ts` y `public.ts`.
- `src/app/` — rutas Next; cada `page.tsx` es un wrapper que compone `AppShell` + `AuthGuard` + la página del módulo.

Regla: un módulo solo importa `shared/*`, su propio árbol y el `public.ts` de los módulos de su `dependsOn`. `pnpm modules:check` verifica estructura, fronteras, registry y contrato (`OPENAPI_PATH`, default `../G3-Chatbot-backend/docs/openapi.json`).

Flujo de trabajo (spec primero, un PR por módulo, gates):
[`docs/flujo-de-trabajo.md`](docs/flujo-de-trabajo.md). Estructura completa:
[`arquitectura-frontend.md`](arquitectura-frontend.md).

## Requisitos

- Node 22
- pnpm 10.34.6 (versión fijada en el campo `packageManager` de `package.json`)

## Comandos

```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm modules:sync   # regenera src/modules/registry.generated.ts
pnpm modules:check  # ids, registry, estructura, fronteras y contrato
```

## Variables de entorno

```bash
cp .env.example .env.local
```

- **`API_PROXY_TARGET`**: a dónde reenvía Next las llamadas `/api/*` (por ejemplo `http://127.0.0.1:8000` en local o la URL del backend en Railway). No tiene valor por defecto: sin ella no hay proxy y la app no llega al backend. En Vercel (`VERCEL` definida) es obligatoria y el build falla si falta.
- **`NEXT_PUBLIC_API_BASE_URL`**: opcional y comentada en la plantilla. Sin definir o vacía, el navegador usa el mismo origen (`/api/v1`) y Next reenvía. Solo se define si el frontend debe llamar a otro origen.

No hay secretos en el frontend: todo lo que empieza por `NEXT_PUBLIC_` acaba en el bundle del navegador. Los secretos viven en el backend (ver su `docs/entorno.md`) y en las variables de Vercel. Nunca se commitea `.env.local`; la plantilla sí (`!.env.example`).

## Migración desde npm

El proyecto usa pnpm; el CI instala con `pnpm install --frozen-lockfile`. Para actualizar un entorno local existente:

1. Instale pnpm (por ejemplo, con `corepack enable`, que toma la versión de `package.json`).
2. Elimine el directorio `node_modules` local y cualquier `package-lock.json`.
3. Ejecute `pnpm install`.

No vuelva a usar `npm install`: recrearía `package-lock.json`.
