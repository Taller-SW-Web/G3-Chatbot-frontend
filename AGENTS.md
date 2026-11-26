<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Reglas del producto

- **Enfoque mobile-first:** la app es web, de pantalla completa y de uso mobile-first (patrón tipo ChatGPT / WhatsApp Web). Todo componente se diseña primero para móvil y luego se adapta a escritorio.
- **Cuenta:** se puede navegar sin cuenta (conversar, buscar productos, ver ofertas) con sesión anónima. La cuenta es obligatoria para comprar (del carrito al checkout) y para consultar pedidos, reclamos y devoluciones. No existe un flujo de compra como invitado.

## Flujo modular (ADR-0024)

Antes de escribir código:

1. **Lee la spec del módulo** (`SPEC-*`) y `src/modules/<id>/MODULE.md`. Si el
   cambio no está en la spec, actualízala en el mismo PR.
2. **Revisa coherencia** con lo existente: nombres, errores por `code`, estados,
   textos y el `public.ts` de los módulos vecinos.
3. **Un PR/MR por módulo.** `shared/` o `app/` van aparte con label
   `cross-modulo`. No mezcles dos `mod-*` en el mismo PR.
4. Respeta las fronteras: `public.ts` para otros módulos, sin imports profundos,
   sin `container.api` dentro de `src/modules/**`, sin `import()` dinámico no
   literal. Las excepciones viven en `scripts/module-boundaries.exceptions.json`.
5. **Verifica antes de pedir review:** `pnpm lint`, `pnpm typecheck`,
   `pnpm test`, `pnpm test:coverage`, `pnpm build` y `pnpm modules:check`
   (estructura + fronteras + registry + contrato `openapi`).
6. Si cambias un endpoint, actualiza el `openapi.json` del backend con el tag
   `mod-<id>` y el `module.manifest.ts`; el gate de contrato lo exige.
7. **No cierres un issue hasta que el PR esté mergeado en `development`** y
   verificado. El cierre cita PR, commit y evidencia; duplicado u obsoleto se
   cierra con motivo, nunca como `completed` si el trabajo sigue pendiente.

Detalle operativo: `docs/flujo-de-trabajo.md`. Estructura: `arquitectura-frontend.md`.
