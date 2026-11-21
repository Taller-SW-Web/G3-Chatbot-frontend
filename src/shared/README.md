# `src/shared` — kernel del frontend

Carpeta compartida por todos los módulos (ADR-0024). **No contiene reglas de negocio.**
Un módulo puede importarla libremente; ella solo importa módulos por su `public.ts`
(excepto `di/container.ts`, que es el composition root).

| Carpeta | Contenido |
|---|---|
| `api/` | Instancia Axios + interceptores (`http.ts`), problem+json (`httpError.ts`), idempotencia y single-flight |
| `auth/` | Store de sesión/carrito (`chatStore`), helpers de sesión, tipos de cliente, `AuthGuard`, `SesionIndicator`, modal de celular, política de contraseña |
| `commerce/` | Helper puro conversación → carrito anónimo |
| `config/` | `apiConfig` y el tipo de los `module.manifest.ts` |
| `di/` | Composition root (`container`) y `queryClient` |
| `security/` | `sanitize` y CSP |
| `testing/` | `setup.ts` de Vitest y fixtures compartidos |
| `ui/` | Iconos, `BrandLogo`, `StatusBadge`, `BloqueError`, `QueryProvider` y `ui/shell/AppShell` |

## Excepciones de composición

- `ui/shell/AppShell.tsx` compone `AuthModal` (mod-auth), `useCarrito` (mod-cart) y `Sidebar` (mod-chat) por sus `public.ts`: es el chrome de la app, no un módulo de negocio.
- `di/container.ts` importa los adapters de cada módulo porque cablea las implementaciones (composition root).
- `auth/chatStore.ts` tipa `carrito` con el `CarritoUI` de mod-cart (import de tipo): el store de sesión es compartido y el carrito vive en el dominio de mod-cart.

Estas aristas están permitidas por `scripts/check-modules.mjs` solo en esos archivos; cualquier
otro import de `shared/` hacia dentro de un módulo se reporta como error.
