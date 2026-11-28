# Rendimiento y Accesibilidad en Frontend: Lighthouse CI (H5-P4)

> **Tarea:** H5-P4 de [`odd/tasks/hito-5.md`](../../G3-Chatbot-specs/odd/tasks/hito-5.md).  
> **Referencia:** [`docs/slo-performance.md`](../../G3-Chatbot-specs/docs/slo-performance.md).  
> **Responsable:** Diego.  
> **Configuración:** `lighthouserc.cjs`.  
> **Gate en CI:** Job `lighthouse` integrado en el check bloqueante `check` de `.github/workflows/ci.yml`.

---

## 1. Propósito y Enfoque Mobile-First

Este documento establece la línea base, la configuración operativa y los presupuestos de rendimiento, Core Web Vitals y accesibilidad para el cliente web en Next.js.

El canal conversacional es **estrictamente mobile-first**:
* La auditoría de Lighthouse se ejecuta con el **preset móvil por defecto** (emulación de dispositivo móvil, pantalla de 360×640 px, CPU 4x y red 4G) y con **throttling aplicado (`throttlingMethod: "devtools"`)**, para medir el comportamiento real en el runner y no una extrapolación del simulador.
* Se realizan **3 ejecuciones (`numberOfRuns: 3`)** por cada URL para calcular la mediana y descartar variaciones espurias o ruido de red/CPU en los runners de CI.
* El job levanta un **mock mínimo del backend** (`scripts/lighthouse/mock-api.mjs`) que responde catálogo y carrito vacíos. Así el LCP mide el render del UI y no el retry del catálogo cuando el backend no existe; el mock corre junto a `next start` mediante `scripts/lighthouse/serve.mjs`.
* El sidebar del chat y el modal de auth se cargan bajo demanda (`React.lazy`); el logo usa `sizes` para no descargar una imagen de 3840 px. El detalle de producto no se puede separar del chunk del catálogo sin cambiar la superficie pública de `mod-catalog` (también la usa el chat): queda como follow-up.
* La home ya no importa el grafo de UI del chat (markdown, bloques, SSE) en el render inicial: el límite del compositor vive en `shared/config/chatContract.ts` y la conversación se crea con `import()` al enviar el primer mensaje.
* `/carrito` renderiza su shell (totales, CTA y mensaje de carga) en el servidor; el estado vacío deja de ser el LCP porque ya no espera a la hidratación ni a `GET /carrito` (fix de [#164](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/issues/164)).
* `/privacidad` y `/terminos` son Server Components: solo el botón "volver" hidrata.
* Un fallo en cualquier presupuesto con nivel `error` tumba el job `lighthouse` y, en consecuencia, el gate requerido `check` de `.github/workflows/ci.yml`, bloqueando el merge hacia `development`.

---

## 2. Presupuestos y Umbrales

Configurados en [`lighthouserc.cjs`](../lighthouserc.cjs):

| Métrica / Categoría | Objetivo Proyecto | Techo en CI | Nivel en CI | Criterio y Justificación Técnica |
|---|:---:|:---:|:---:|---|
| **Largest Contentful Paint (LCP)** | $\le 2500\text{ ms}$ | $\le 2500\text{ ms}$ | `error` (Bloqueante) | Rango **Good** de Google Core Web Vitals en las 4 URLs. `/carrito` ya no depende de la hidratación: su shell se pinta en el servidor y el estado vacío llega después sin convertirse en el LCP (fix de [#164](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/issues/164)). |
| **Cumulative Layout Shift (CLS)** | $\le 0.10$ | $\le 0.10$ | `error` (Bloqueante) | Rango **Good** de Google Core Web Vitals (estabilidad visual sin saltos). |
| **Total Blocking Time (TBT)** | $\le 200\text{ ms}$ | $\le 350\text{ ms}$ | `error` (Bloqueante) | **Proxy de INP:** En entornos de laboratorio sintéticos (CI sin interacción humana directa), Lighthouse no puede calcular el Interaction to Next Paint (INP) de campo. Por ello, se utiliza el Total Blocking Time (TBT) como proxy directo de congestión del hilo principal. El objetivo es $\le 200\text{ ms}$; la mediana local post-fix quedó en 109–113 ms (§4.2) y el techo de 350 ms queda como margen de varianza del runner. |
| **Tamaño de Scripts JS** | $\le 600\text{ KB}$ | $\le 600\text{ KB}$ | `error` (Bloqueante) | Presupuesto de peso estricto para evitar sobrecargar la descarga e hidratación de JavaScript. |
| **Tamaño Total de Recursos** | $\le 1.8\text{ MB}$ | $\le 1.8\text{ MB}$ | `error` (Bloqueante) | Techo máximo de transferencia acumulada (imágenes optimizadas, fuentes, CSS y bundles). |
| **Accesibilidad (a11y)** | Score $\ge 0.90$ | Score $\ge 0.90$ | `error` (Bloqueante) | **Proxy de accesibilidad:** La puntuación de Lighthouse evalúa reglas automatizadas de contraste, atributos ARIA, nombres accesibles y roles semánticos. Funciona como gate preventivo automático, pero no sustituye una auditoría funcional y manual completa de WCAG 2.1 AA. |
| **Rendimiento General** | Score $\ge 0.70$ | Score $\ge 0.70$ | `warn` (Alerta) | Umbral de advertencia sobre la puntuación agregada del motor Lighthouse. |
| **Mejores Prácticas** | Score $\ge 0.80$ | Score $\ge 0.80$ | `warn` (Alerta) | Prácticas web modernas (HTTPS, doctype, librerías sin vulnerabilidades). |
| **SEO** | Score $\ge 0.80$ | Score $\ge 0.80$ | `warn` (Alerta) | Meta-etiquetas, viewports y rastreabilidad de páginas estáticas. |

---

## 3. URLs Auditadas

Lighthouse audita 4 vistas **públicas** y distintas:
1. **`/` (Home / Catálogo):** banner, ofertas y compositor del chat.
2. **`/carrito` (Carrito):** estado vacío y resumen de líneas.
3. **`/buscar` (Buscar chats):** formulario de búsqueda de conversaciones.
4. **`/privacidad` (Privacidad):** contenido legal estático.

Las pantallas autenticadas (`/pedidos`, `/cuenta`, `/checkout`) quedan fuera: `AuthGuard` las redirige a `/?abrirLogin=1` sin sesión, así que auditarlas mediría la home otra vez. Para incluirlas hace falta sembrar una sesión de prueba; queda como follow-up de rendimiento aparte del fix de LCP.

---

## 4. Línea Base Medida en CI (Preset Móvil - Mediana de 3 Corridas)

Mediciones del run de CI [46059814273](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/actions/runs/46059814273) (commit `2016869`), con throttling DevTools 4x CPU / 4G y el mock de backend. Es la línea base **previa** al fix de #164; la medición local posterior está en §4.2. El CI repite esta medición en cada PR y publica el artefacto `lighthouse-reports`.

| URL Auditada | Rendimiento | Accesibilidad | LCP (Mediana) | CLS (Mediana) | TBT (Mediana) | Peso Scripts | Peso Total | Estado |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **`/` (Home)** | 96% | 96% | $1762\text{ ms}$ | $0.000$ | $195\text{ ms}$ | $380\text{ KB}$ | $493\text{ KB}$ | ✅ Bajo presupuesto |
| **`/carrito` (Carrito)** | 87% | 100% | $3971\text{ ms}$ | $0.000$ | $81\text{ ms}$ | $231\text{ KB}$ | $316\text{ KB}$ | ⚠️ Excepción LCP (pre-fix #164; ver §4.2) |
| **`/buscar` (Buscar chats)** | 99% | 100% | $1668\text{ ms}$ | $0.000$ | $83\text{ ms}$ | $379\text{ KB}$ | $464\text{ KB}$ | ✅ Bajo presupuesto |
| **`/privacidad` (Privacidad)** | 99% | 100% | $1559\text{ ms}$ | $0.000$ | $65\text{ ms}$ | $267\text{ KB}$ | $353\text{ KB}$ | ✅ Bajo presupuesto |

### 4.1 Limitaciones y Condiciones de la Medición

1. **Mock de backend (`scripts/lighthouse/mock-api.mjs`):**
   * El job compila con `API_PROXY_TARGET=http://127.0.0.1:4010`; el mock responde `GET /api/v1/catalogo/productos` y `GET /api/v1/carrito` con listas vacías.
   * No es una réplica del backend ni mide latencia real de G5/G6/G7: mide el render del UI con una respuesta inmediata. Las pantallas con datos reales se validan en E2E e integración.
2. **Throttling aplicado (DevTools):**
   * Lighthouse aplica CPU 4x y red 4G reales del emulador; no extrapola con el simulador. Es más lento y más variable que `simulate`, pero refleja lo que ve un móvil en el runner.
   * En runners compartidos de 2 vCPUs el TBT puede variar; la mediana de CI fue 195 ms y el presupuesto 350 ms deja margen para esa varianza.
3. **Pantallas autenticadas:** `/pedidos`, `/cuenta` y `/checkout` redirigen a la home sin sesión, por eso no están en la matriz. Sembrar una sesión de prueba sigue como follow-up de rendimiento independiente del fix de LCP.

### 4.2 Medición local del fix de #164 (2026-11-28)

Corrida local con el mismo preset móvil (`throttlingMethod: "devtools"`, CPU 4x/4G), build de producción con Turbopack y el mock de backend, 3 corridas por URL. **No sustituye la medición de CI:** el run del PR que integra el fix es el que confirma estos valores en el runner compartido.

| URL | LCP antes | LCP después | TBT antes (rango) | TBT después (rango) | JS transferido antes | JS transferido después |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `/` | $1994\text{ ms}$ | $1778\text{ ms}$ | 318–944 ms (mediana 783) | **108–118 ms (mediana 109)** | 400.2 KB | **295.1 KB** |
| `/carrito` | $4206\text{ ms}$ | $1758\text{ ms}$ | 144–2486 ms (mediana 218) | **108–124 ms (mediana 111)** | 237.4 KB | 237.5 KB |
| `/buscar` | $1704\text{ ms}$ | $1741\text{ ms}$ | 110–139 ms | 112–259 ms (mediana 113) | 394.9 KB | 394.4 KB |
| `/privacidad` | $1740\text{ ms}$ | $1746\text{ ms}$ | 97–121 ms | 100–106 ms (mediana 103) | 274.7 KB | 269.0 KB |

Qué cambió:

1. **`/carrito`:** el shell con totales, CTA y el mensaje "Preparando tu carrito" se renderiza en servidor. El elemento LCP pasó de ser el párrafo del estado vacío (pintado tras hidratar y resolver el GET, ~3.6 s de `elementRenderDelay`) al shell del primer render.
2. **`/`:** la home dejó de importar `mod-chat/public` en el grafo inicial. Eso eliminó del primer render los chunks de markdown/micromark (~209 KB raw) y los schemas Zod que arrastraba el chat (~147 KB raw). El JS transferido bajó 26% y el TBT pasó de 318–944 ms a 108–118 ms en las 3 corridas.
3. **Páginas estáticas:** `/privacidad` y `/terminos` dejaron de hidratar su contenido (solo hidrata el botón "volver"). El sidebar y el modal de auth ya eran `React.lazy`; separar el detalle de producto exige cambiar la superficie pública de `mod-catalog` (el chat también consume `DetalleProducto`), así que se documenta como follow-up en lugar de forzar un split que el barrel volvería a incluir.

El gate se aprieta en el mismo cambio: LCP $\le 2500\text{ ms}$ para las 4 URLs y `aggregationMethod: "median"` para que bloquee la mediana de las 3 corridas (antes el assert usaba la mejor corrida y el techo de `/carrito` era 4800 ms).

---

## 5. Integración con el Gate de Merge

Lighthouse CI está formalmente incorporado como el job `lighthouse` dentro del pipeline principal `.github/workflows/ci.yml`.

El job obligatorio de la rama protegida es **`check`**, el cual declara explícitamente:
```yaml
check:
  name: check
  needs:
    - scope
    - validate
    - unit-tests
    - build
    - lighthouse
    - security
    - e2e
    - dependency-review
    - sonar
    - specs
```
Si cualquier presupuesto marcado como `error` es superado, el job `lighthouse` falla, el job `check` no se completa y GitHub bloquea el merge hacia `development`.

---

## 6. Excepciones Técnicas y Procedimiento

### 6.1 Excepción Técnica Retirada: LCP de `/carrito` (fix de #164, 2026-11-28)

* **Estado:** **retirada**. El techo temporal de $\text{LCP} \le 4800\text{ ms}$ para `/carrito` ya no aplica: las 4 URLs auditadas exigen $\text{LCP} \le 2500\text{ ms}$.
* **Historia:** la excepción se aprobó el 2026-11-27 en la revisión del PR #180 porque el estado vacío de `/carrito` aparecía después de la hidratación y de `GET /carrito`. Con throttling DevTools y 3 corridas, CI midió $3971\text{ ms}$ en `/carrito`, frente a $1762\text{ ms}$ en `/`, $1668\text{ ms}$ en `/buscar` y $1559\text{ ms}$ en `/privacidad`.
* **Causa y fix:** el LCP era el párrafo del estado vacío insertado tras hidratar. Ahora el shell de `/carrito` (totales, CTA y mensaje de carga) se pinta en el servidor y el estado vacío llega después sin superar el área ya pintada. El detalle está en §4.2.
* **Evidencia:** medición local del 2026-11-28 en §4.2: LCP de `/carrito` $1758\text{ ms}$ y TBT $111\text{ ms}$ (medianas de 3 corridas). La confirmación en el runner compartido es el job `lighthouse` del PR que integra el fix; si ese run no cumple, el merge queda bloqueado por el gate.
* **TBT:** el techo de CI se mantiene en $\le 350\text{ ms}$ como margen de varianza del runner de 2 vCPUs; el objetivo de producto sigue en $\le 200\text{ ms}$ y la mediana local bajó a 103–113 ms en las 4 URLs.
* **Presupuestos estrictos sin excepción:** Accesibilidad ($\ge 0.90$), CLS ($\le 0.10$), scripts JS ($\le 600\text{ KB}$) y tamaño total ($\le 1.8\text{ MB}$) operan en nivel `error` estricto y bloqueante.
* **Procedimiento:** el retiro aprieta el gate (no lo afloja) y sigue §6.2; la aprobación original de `@Ankarmin` queda registrada arriba.

### 6.2 Procedimiento General para Nuevas Excepciones

Si una funcionalidad crítica de producto requiere incorporar un elemento pesado o una librería que temporalmente vulnere un presupuesto:
1. **No se afloja el assert** en `lighthouserc.cjs` de manera silenciosa.
2. Se documenta la justificación en el PR y se añade una entrada a este documento con:
   * Métrica afectada y valor observado.
   * Causa técnica identificada.
   * Issue de deuda técnica u optimización asignada.
   * Aprobación explícita del líder técnico (`@Ankarmin`).
