# G3 Chatbot Frontend

Frontend de Next.js del canal chatbot. La arquitectura está descrita en `arquitectura-frontend.md`.

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
```

## Migración desde npm

El proyecto usa pnpm; el CI instala con `pnpm install --frozen-lockfile`. Para actualizar un entorno local existente:

1. Instale pnpm (por ejemplo, con `corepack enable`, que toma la versión de `package.json`).
2. Elimine el directorio `node_modules` local y cualquier `package-lock.json`.
3. Ejecute `pnpm install`.

No vuelva a usar `npm install`: recrearía `package-lock.json`.
