# Enrutamiento del frontend por el API Gateway (H5-G2, ADR-0031)

El navegador siempre llama a `/api/v1/*` en el mismo origen del frontend
(`NEXT_PUBLIC_API_BASE_URL` vacía o `/api/v1`), y Next.js reenvía esas rutas
mediante `rewrites` hacia `API_PROXY_TARGET` ([ADR-0023](https://github.com/Taller-SW-Web/G3-Chatbot-specs/blob/development/docs/arquitectura/adr/ADR-0023-proxy-del-frontend-hacia-la-api-mismo-origen.md)).

## Configuración en Vercel (Preview y Production)

1. Abrir **Project Settings → Environment Variables** en Vercel.
2. Configurar `API_PROXY_TARGET` en **Production** y **Preview** con la URL
   pública del servicio Kong OSS en Railway:
   - `API_PROXY_TARGET=https://<gateway>.up.railway.app`
3. Verificar que `NEXT_PUBLIC_API_BASE_URL` **no** apunte a una URL directa del
   backend (dejarla sin definir o en `/api/v1` para mantener mismo origen y
   `connect-src 'self'` en la CSP).
4. Redesplegar y comprobar:
   - `curl -i https://<frontend>/api/v1/catalogo/productos` → `200` con
     `x-gateway: kong` y `x-request-id`.
   - `PLAYWRIGHT_VERIFY_GATEWAY=true BASE_URL=https://<frontend> pnpm exec playwright test tests/e2e/gateway.spec.ts`

## Rollback

Si el gateway falla durante una demostración:

1. En Vercel, cambiar `API_PROXY_TARGET` de vuelta a la URL anterior del
   backend (`https://<backend>.up.railway.app`) en **Production** y **Preview**.
2. Redesplegar en Vercel (sin cambios de código ni de CSP).
3. Verificar `GET https://<frontend>/api/v1/catalogo/productos` (`200`).
