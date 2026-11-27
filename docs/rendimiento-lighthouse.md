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
* El sidebar del chat y el modal de auth se cargan bajo demanda (`React.lazy`), y el logo usa `sizes` para no descargar una imagen de 3840 px.
* Un fallo en cualquier presupuesto con nivel `error` tumba el job `lighthouse` y, en consecuencia, el gate requerido `check` de `.github/workflows/ci.yml`, bloqueando el merge hacia `development`.

---

## 2. Presupuestos y Umbrales

Configurados en [`lighthouserc.cjs`](../lighthouserc.cjs):

| Métrica / Categoría | Objetivo Proyecto | Techo en CI (Excepción) | Nivel en CI | Criterio y Justificación Técnica |
|---|:---:|:---:|:---:|---|
| **Largest Contentful Paint (LCP)** | $\le 2500\text{ ms}$ | $\le 2500\text{ ms}$ en `/`, `/buscar` y `/privacidad`; $\le 4800\text{ ms}$ en `/carrito` | `error` (Bloqueante) | Rango **Good** de Google Core Web Vitals. Las pantallas que renderizan contenido en servidor ya cumplen 2500 ms. `/carrito` mantiene el techo 4800 ms porque su estado vacío aparece tras la hidratación; la deuda sigue en [#164](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/issues/164). |
| **Cumulative Layout Shift (CLS)** | $\le 0.10$ | $\le 0.10$ | `error` (Bloqueante) | Rango **Good** de Google Core Web Vitals (estabilidad visual sin saltos). |
| **Total Blocking Time (TBT)** | $\le 200\text{ ms}$ | $\le 350\text{ ms}$ | `error` (Bloqueante) | **Proxy de INP:** En entornos de laboratorio sintéticos (CI sin interacción humana directa), Lighthouse no puede calcular el Interaction to Next Paint (INP) de campo. Por ello, se utiliza el Total Blocking Time (TBT) como proxy directo de congestión del hilo principal. El objetivo es $\le 200\text{ ms}$; el techo de CI es 350 ms (peor mediana observada: 321 ms en `/`). |
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

Las pantallas autenticadas (`/pedidos`, `/cuenta`, `/checkout`) quedan fuera: `AuthGuard` las redirige a `/?abrirLogin=1` sin sesión, así que auditarlas mediría la home otra vez. Para incluirlas hace falta sembrar una sesión de prueba; queda como follow-up de [#164](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/issues/164).

---

## 4. Línea Base Medida (Preset Móvil - Mediana de 3 Corridas)

Mediciones de referencia del 2026-11-27 con el mismo comando del job (`pnpm lhci`), throttling DevTools 4x CPU / 4G y el mock de backend. El CI repite esta medición en cada PR y publica el artefacto `lighthouse-reports`.

| URL Auditada | Rendimiento | Accesibilidad | LCP (Mediana) | CLS (Mediana) | TBT (Mediana) | Peso Scripts | Peso Total | Estado |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **`/` (Home)** | 91% | 96% | $1857\text{ ms}$ | $0.000$ | $321\text{ ms}$ | $380\text{ KB}$ | $493\text{ KB}$ | ✅ Bajo presupuesto |
| **`/carrito` (Carrito)** | 85% | 100% | $4071\text{ ms}$ | $0.000$ | $119\text{ ms}$ | $231\text{ KB}$ | $316\text{ KB}$ | ⚠️ Excepción LCP |
| **`/buscar` (Buscar chats)** | 98% | 100% | $1704\text{ ms}$ | $0.000$ | $132\text{ ms}$ | $379\text{ KB}$ | $464\text{ KB}$ | ✅ Bajo presupuesto |
| **`/privacidad` (Privacidad)** | 98% | 100% | $1751\text{ ms}$ | $0.000$ | $98\text{ ms}$ | $267\text{ KB}$ | $353\text{ KB}$ | ✅ Bajo presupuesto |

### 4.1 Limitaciones y Condiciones de la Medición

1. **Mock de backend (`scripts/lighthouse/mock-api.mjs`):**
   * El job compila con `API_PROXY_TARGET=http://127.0.0.1:4010`; el mock responde `GET /api/v1/catalogo/productos` y `GET /api/v1/carrito` con listas vacías.
   * No es una réplica del backend ni mide latencia real de G5/G6/G7: mide el render del UI con una respuesta inmediata. Las pantallas con datos reales se validan en E2E e integración.
2. **Throttling aplicado (DevTools):**
   * Lighthouse aplica CPU 4x y red 4G reales del emulador; no extrapola con el simulador. Es más lento y más variable que `simulate`, pero refleja lo que ve un móvil en el runner.
   * En runners compartidos de 2 vCPUs el TBT puede variar; el presupuesto 350 ms deja margen sobre la mediana observada (321 ms).
3. **Pantallas autenticadas:** `/pedidos`, `/cuenta` y `/checkout` redirigen a la home sin sesión, por eso no están en la matriz. Sembrar una sesión de prueba es un follow-up de [#164](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/issues/164).

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

### 6.1 Excepción Técnica en CI (Mobile Emulation) - Aprobada por @Ankarmin

* **Métrica afectada:** LCP y TBT en preset mobile en runners de CI.
* **Valores medidos (throttling DevTools, 3 corridas):** LCP $= 1857\text{ ms}$ en `/`, $1704\text{ ms}$ en `/buscar`, $1751\text{ ms}$ en `/privacidad` y $4071\text{ ms}$ en `/carrito`; peor TBT $= 321\text{ ms}$ en `/`.
* **Causa técnica identificada:** El estado vacío de `/carrito` aparece después de la hidratación y de `GET /carrito`; bajo CPU 4x ese render es el LCP. Las demás pantallas renderizan contenido en servidor y ya cumplen el objetivo.
* **Presupuesto objetivo formal:** $\text{LCP} \le 2500\text{ ms}$ y $\text{TBT} \le 200\text{ ms}$ (se mantienen como meta del proyecto).
* **Techo bloqueante en CI:** `assertMatrix` exige $\text{LCP} \le 2500\text{ ms}$ en `/`, `/buscar` y `/privacidad`; `/carrito` conserva $\text{LCP} \le 4800\text{ ms}$ y el TBT global es $\le 350\text{ ms}$ mientras se atiende [#164](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/issues/164).
* **Estado de aprobación:** Aprobada explícitamente por el líder técnico (`@Ankarmin`) el 2026-11-27 en la revisión del PR #180, conforme al procedimiento de §6.2. La excepción se revisa cuando se cierre [#164](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/issues/164).
* **Presupuestos estrictos sin excepción:** Accesibilidad ($\ge 0.90$), CLS ($\le 0.10$), scripts JS ($\le 600\text{ KB}$) y tamaño total ($\le 1.8\text{ MB}$) operan en nivel `error` estricto y bloqueante.

### 6.2 Procedimiento General para Nuevas Excepciones

Si una funcionalidad crítica de producto requiere incorporar un elemento pesado o una librería que temporalmente vulnere un presupuesto:
1. **No se afloja el assert** en `lighthouserc.cjs` de manera silenciosa.
2. Se documenta la justificación en el PR y se añade una entrada a este documento con:
   * Métrica afectada y valor observado.
   * Causa técnica identificada.
   * Issue de deuda técnica u optimización asignada.
   * Aprobación explícita del líder técnico (`@Ankarmin`).
