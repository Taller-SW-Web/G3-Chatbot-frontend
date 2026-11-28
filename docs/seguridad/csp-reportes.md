# CSP y reportes de violaciones

- **Estado:** CSP en `Report-Only` con reportes activos (2026-11-28).
- **Dueño:** `shared/security` (label `cross-modulo`).
- **Código:** `src/shared/security/csp.ts`, `src/shared/security/cspReport.ts`,
  `src/app/csp-report/route.ts` y `next.config.ts`.

## Qué se envía

En producción cada respuesta lleva dos cabeceras complementarias:

```http
Reporting-Endpoints: csp-endpoint="/csp-report"
Content-Security-Policy-Report-Only: default-src 'self'; …; report-uri /csp-report; report-to csp-endpoint
```

- `report-to csp-endpoint` usa la Reporting API (CSP3) y entrega
  `application/reports+json`.
- `report-uri /csp-report` mantiene a los navegadores que solo entienden CSP2.
  Si un navegador soporta ambos, prioriza `report-to`.
- La URL es relativa a propósito: el navegador la resuelve contra la página
  (el spec de Reporting API define el parseo con la URL del documento).
- **En desarrollo** (`NODE_ENV=development`) solo se envía `report-uri` y se
  omite `Reporting-Endpoints`/`report-to`: los navegadores no procesan esa
  cabecera sobre HTTP y, como prefieren `report-to` sobre `report-uri`,
  perderían los reportes. En producción (HTTPS) funcionan ambos.

El endpoint es same-origin y **no** pasa por el rewrite `/api/*` del gateway.

## Endpoint `POST /csp-report`

| Entrada | Respuesta |
|---|---|
| `application/csp-report` (formato `{"csp-report": {…}}`) | `204` |
| `application/reports+json` (array de la Reporting API) | `204` |
| `application/json` (proxy que reescribe el tipo) | `204` |
| JSON inválido o forma desconocida | `400` |
| Cuerpo > 16 KiB (`CSP_REPORT_MAX_BYTES`) | `413` |
| Otro `Content-Type` | `415` |

El handler no devuelve cuerpo ni refleja la entrada. Por cada reporte deja una
línea en los logs del servidor:

```text
[csp-report] {"type":"csp-violation","disposition":"report","directive":"script-src-elem","documentUrl":"https://app/checkout","blockedUrl":"inline"}
```

Saneado aplicado antes de registrar:

- se eliminan query string y fragmento de las URLs (pueden llevar tokens);
- se quitan caracteres de control y se trunca cada campo a 200 caracteres;
- se procesan como máximo 20 reportes por request.

No se envía nada a un tercero: los reportes quedan en los logs de la
plataforma (Vercel/Railway). Si en el futuro se necesita agregación, se
forwardean desde el handler, nunca desde el navegador.

## Decisión de enforce

**Se mantiene `Report-Only` hasta el 2027-01-31.** La política todavía usa
`script-src 'self' 'unsafe-inline'` porque el arranque de Next inyecta scripts
inline y no hay nonces: pasar a bloqueante hoy rompería la hidratación.

Para esa fecha se revisa con esta evidencia:

1. ≥ 14 días de reportes en producción sin violaciones inesperadas de
   `script-src`, `style-src` o `connect-src`.
2. Migración a nonces con `proxy.ts` (Next 16) y render dinámico, retirando
   `'unsafe-inline'` de `script-src`.
3. `pnpm build` y E2E en verde con la cabecera
   `Content-Security-Policy` (sin `-Report-Only`).

Si no se cumple, se renueva la fecha con el motivo en este documento; no se
elimina el reporte. El cambio de cabecera se hace en `next.config.ts` y se
conserva `report-uri`/`report-to` para seguir observando.

## Verificación manual

```bash
# 1) Cabeceras en la app
curl -sI http://localhost:3000/ | grep -Ei 'content-security|reporting-endpoints'

# 2) Reporte legacy
curl -i -X POST http://localhost:3000/csp-report \
  -H 'content-type: application/csp-report' \
  --data '{"csp-report":{"document-uri":"https://app.test/a?token=x","blocked-uri":"inline","effective-directive":"script-src-elem","disposition":"report"}}'
# → 204 y una línea [csp-report] sin "token=x"

# 3) Reporting API
curl -i -X POST http://localhost:3000/csp-report \
  -H 'content-type: application/reports+json' \
  --data '[{"type":"csp-violation","url":"https://app.test/","body":{"effectiveDirective":"script-src-elem","blockedURL":"inline","disposition":"report"}}]'
# → 204
```

En el navegador, DevTools → Network muestra los POST a `/csp-report` cuando una
extensión o un cambio de política provoca una violación. Los tests unitarios
del parser y del handler viven en `tests/unit/shared/cspReport.test.ts`.
