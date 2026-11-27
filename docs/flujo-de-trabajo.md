# Flujo de trabajo — frontend modular

Guía operativa para cualquier cambio en `G3-Chatbot-frontend` desde ADR-0024.
Si contradice una spec, manda la spec; si contradice el ADR, se abre un ADR
nuevo antes de romper la frontera.

## 1. Antes de tocar código

1. **Lee la spec del módulo.** Busca el `SPEC-*` que cubre la capacidad y el
   `src/modules/<id>/MODULE.md` (responsabilidad, rutas, endpoints, `dependsOn`).
2. **Ubica el módulo dueño.** Si el cambio cruza dos capacidades, decide cuál
   es el dueño y cuál solo compone. Si no hay dueño claro, primero actualiza la
   spec; no inventes un módulo nuevo sin ADR.
3. **Revisa lo existente.** Nombres, envelope de errores (`code`), estados de
   UI (carga/vacío/error), textos y patrones del módulo. No dupliques un
   componente o caso de uso que ya vive en otro `public.ts`.
4. **Comprueba el contrato.** El endpoint debe estar en el `openapi.json` del
   backend con el tag `mod-<id>` y declarado en `module.manifest.ts`. Si el
   backend aún no lo publica, se documenta como excepción temporal con
   `TODO` y `reviewBy` en `scripts/module-boundaries.exceptions.json`.

## 2. Si el cambio no está en la spec

Abre una issue en `G3-Chatbot-specs` asignada a `@Ankarmin` y `@MathiasTL`; no
abras ramas ni PRs en specs. El PR de frontend espera a que la spec esté en
`development`. Si el cambio es solo de implementación, deja la decisión en el
`MODULE.md` del módulo. Un PR no puede introducir comportamiento que la spec no
describe.

- Cambio de contrato → spec + `module.manifest.ts` + `openapi.json` del backend.
- Cambio de flujo/UX → spec + textos del módulo.
- Cambio de frontera o de `dependsOn` → ADR-0024 (o ADR nuevo) + manifiesto
  central + `module.manifest.ts`.

## 3. Un PR/MR por módulo

| Alcance | Rama | Label | Revisión |
|---|---|---|---|
| Un `mod-*` | `feat/<id>-<tema>` o `fix/<id>-<tema>` | — | owner del módulo |
| `shared/` o `app/` | `feat/shared-<tema>` o `fix/shared-<tema>` | `cross-modulo` | owner del módulo afectado + plataforma |
| Varios módulos | se divide en PRs encadenados | — | un owner por PR |

Reglas:

- No mezcles dos módulos en un PR. Si el cambio exige tocar otro módulo, se
  hace primero el PR de ese módulo (o se usa su `public.ts` si ya alcanza).
- `shared/` no lleva lógica de negocio: si tu cambio lo parece, vuelve al
  módulo dueño.
- Los archivos de `src/app/**` son composition root: un cambio ahí se justifica
  por la composición, no por lógica nueva.
- No edites `src/modules/registry.generated.ts` a mano; corre `pnpm modules:sync`.

## 4. Implementación

1. Respeta las capas: `domain` puro → `application` casos de uso → `ports`
   contratos → `adapters` red → `ui` presentación.
2. Expón solo lo necesario en `public.ts`; lo demás queda privado.
3. Mantén las URLs, textos y comportamiento existentes salvo que la spec diga
   lo contrario.
4. Si mueves código, mueve también sus tests (no los borres).
5. Si añades una excepción de frontera, documéntala en el JSON con motivo; si
   es temporal, con `reviewBy`.

## 5. Verificación obligatoria

Antes de pedir review:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm build
pnpm modules:check
pnpm audit --audit-level=high
```

El job `validate` del CI agrupa lint, tipos, `modules:check` y los tests de `scope.mjs`. Para reproducirlo:

```bash
OPENAPI_PATH=../G3-Chatbot-backend/docs/openapi.json \
  node scripts/ci/run-validators.mjs
node scripts/ci/scope.mjs --base origin/development --event pull_request --json
```

En PowerShell, define `OPENAPI_PATH` en una línea aparte antes de invocar Node. Un PR de solo documentación no corre tests, build ni Sonar; la etiqueta `ci:full` fuerza también el E2E y la auditoría, y relanza el workflow. Detalle en [docs/ci-pipeline.md](https://github.com/Taller-SW-Web/G3-Chatbot-specs/blob/development/docs/ci-pipeline.md).

`pnpm audit --audit-level=high` es bloqueante en CI: un advisory `high` o
`critical` tumba el PR. Las excepciones aceptadas se justifican en
[`docs/seguridad/pnpm-audit-exceptions.md`](seguridad/pnpm-audit-exceptions.md).

`modules:check` cubre estructura, fronteras, registry y contrato
(`OPENAPI_PATH`, default `../G3-Chatbot-backend/docs/openapi.json`). Si el
backend no está clonado, el contrato se omite con aviso; en CI se define
`OPENAPI_PATH` para exigirlo.

Checklist del PR:

- [ ] Un solo módulo (o `shared/` con `cross-modulo`).
- [ ] Spec actualizada o cambio justificado en `MODULE.md`.
- [ ] Sin imports profundos a otro módulo ni `container.api` en `src/modules/**`.
- [ ] `module.manifest.ts` y `modules.manifest.json` coherentes; registry regenerado.
- [ ] Endpoints nuevos con tag `mod-<id>` en el openapi del backend.
- [ ] Tests nuevos/movidos y gates en verde.
- [ ] URLs, textos y comportamiento sin cambios no pedidos.

## 6. Después del merge

- Si tocaste `shared/`, avisa a los owners de los módulos que lo consumen.
- Si cambió un contrato, actualiza el `openapi.json` y la spec en el mismo
  ciclo; el gate de contrato fallará hasta que ambos lados coincidan.
- Revisa `scripts/module-boundaries.exceptions.json`: las excepciones vencidas
  bloquean el pipeline; resuélvelas o renueva la fecha con justificación.
