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
* La auditoría de Lighthouse se ejecuta con el **preset móvil por defecto** (emulación de dispositivo móvil, pantalla de 360×640 px, limitación de CPU 4x y emulación de red móvil 4G).
* Se realizan **3 ejecuciones (`numberOfRuns: 3`)** por cada URL para calcular la mediana y descartar variaciones espurias o ruido de red/CPU en los runners de CI.
* Un fallo en cualquier presupuesto con nivel `error` tumba el job `lighthouse` y, en consecuencia, el gate requerido `check` de `.github/workflows/ci.yml`, bloqueando el merge hacia `development`.

---

## 2. Presupuestos y Umbrales

Configurados en [`lighthouserc.cjs`](../lighthouserc.cjs):

| Métrica / Categoría | Objetivo Proyecto | Techo en CI (Excepción) | Nivel en CI | Criterio y Justificación Técnica |
|---|:---:|:---:|:---:|---|
| **Largest Contentful Paint (LCP)** | $\le 2500\text{ ms}$ | $\le 4800\text{ ms}$ | `error` (Bloqueante) | Rango **Good** de Google Core Web Vitals en condiciones móviles 4G. En CI virtualizado (CPU 4x), la mediana inicial es ~4.2s; se activa techo protector mientras se optimiza en [#164](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/issues/164). |
| **Cumulative Layout Shift (CLS)** | $\le 0.10$ | $\le 0.10$ | `error` (Bloqueante) | Rango **Good** de Google Core Web Vitals (estabilidad visual sin saltos). |
| **Total Blocking Time (TBT)** | $\le 200\text{ ms}$ | $\le 750\text{ ms}$ | `error` (Bloqueante) | **Proxy de INP:** En entornos de laboratorio sintéticos (CI sin interacción humana directa), Lighthouse no puede calcular el Interaction to Next Paint (INP) de campo. Por ello, se utiliza el Total Blocking Time (TBT) como proxy directo de congestión del hilo principal. El objetivo es $\le 200\text{ ms}$, con techo protector de 750 ms en CI bajo emulación móvil (Issue [#164](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/issues/164)). |
| **Tamaño de Scripts JS** | $\le 600\text{ KB}$ | $\le 600\text{ KB}$ | `error` (Bloqueante) | Presupuesto de peso estricto para evitar sobrecargar la descarga e hidratación de JavaScript. |
| **Tamaño Total de Recursos** | $\le 1.8\text{ MB}$ | $\le 1.8\text{ MB}$ | `error` (Bloqueante) | Techo máximo de transferencia acumulada (imágenes optimizadas, fuentes, CSS y bundles). |
| **Accesibilidad (a11y)** | Score $\ge 0.90$ | Score $\ge 0.90$ | `error` (Bloqueante) | **Proxy de accesibilidad:** La puntuación de Lighthouse evalúa reglas automatizadas de contraste, atributos ARIA, nombres accesibles y roles semánticos. Funciona como gate preventivo automático, pero no sustituye una auditoría funcional y manual completa de WCAG 2.1 AA. |
| **Rendimiento General** | Score $\ge 0.70$ | Score $\ge 0.70$ | `warn` (Alerta) | Umbral de advertencia sobre la puntuación agregada del motor Lighthouse. |
| **Mejores Prácticas** | Score $\ge 0.80$ | Score $\ge 0.80$ | `warn` (Alerta) | Prácticas web modernas (HTTPS, doctype, librerías sin vulnerabilidades). |
| **SEO** | Score $\ge 0.80$ | Score $\ge 0.80$ | `warn` (Alerta) | Meta-etiquetas, viewports y rastreabilidad de páginas estáticas. |

---

## 3. URLs Auditadas

Lighthouse audita las 4 vistas más críticas del flujo del usuario:
1. **`/` (Home / Catálogo):** Entrada principal, ofertas y búsqueda.
2. **`/carrito` (Carrito):** Resumen de líneas, cupones y cálculo de subtotales.
3. **`/pedidos` (Historial):** Listado y estado de pedidos del cliente.
4. **`/cuenta` (Mi Cuenta):** Formulario de autenticación y gestión de perfil.

---

## 4. Línea Base Medida (Preset Móvil - Mediana)

Mediciones de referencia sobre la compilación de producción (`next build` + `next start`):

| Métrica | Mediana Observada | Presupuesto Máximo | Margen de Seguridad | Estado |
|---|:---:|:---:|:---:|:---:|
| **LCP** | $1362\text{ ms}$ | $2500\text{ ms}$ | $+1138\text{ ms}$ de holgura | ✅ Conforme |
| **CLS** | $0.000$ | $0.100$ | $+0.100$ de holgura | ✅ Conforme |
| **TBT** | $69\text{ ms}$ | $200\text{ ms}$ | $+131\text{ ms}$ de holgura | ✅ Conforme |
| **Peso Scripts** | $371\text{ KB}$ | $600\text{ KB}$ | $+229\text{ KB}$ de holgura | ✅ Conforme |
| **Peso Total** | $505\text{ KB}$ | $1800\text{ KB}$ | $+1295\text{ KB}$ de holgura | ✅ Conforme |
| **Accesibilidad** | $0.96$ ($96\%$) | $\ge 0.90$ | $+6\%$ de holgura | ✅ Conforme |
| **Rendimiento** | $0.96$ ($96\%$) | $\ge 0.70$ | $+26\%$ de holgura | ✅ Conforme |

---

## 5. Integración con el Gate de Merge

Lighthouse CI está formalmente incorporado como el job `lighthouse` dentro del pipeline principal `.github/workflows/ci.yml`.

El job obligatorio de la rama protegida es **`check`**, el cual declara explícitamente:
```yaml
check:
  name: check
  needs: [lint, test, build, security, dependency-review, sonar, e2e, modules, specs, lighthouse]
```
Si cualquier presupuesto marcado como `error` es superado, el job `lighthouse` falla, el job `check` no se completa y GitHub bloquea el merge hacia `development`.

---

## 6. Excepciones Aprobadas y Procedimiento

### 6.1 Excepción Activa: Emulación Móvil en CI (Issue #164)

* **Métrica afectada:** LCP y TBT en preset mobile en runners de CI.
* **Valores observados:** Mediana de LCP $\approx 4200\text{ ms}$; mediana de TBT $\approx 600\text{ ms}$.
* **Causa técnica:** Lighthouse aplica simulación de dispositivo móvil (desaceleración de CPU 4x y red móvil 4G). En runners de GitHub Actions (máquinas virtuales de 2 vCPUs compartidas en Azure), el tiempo sintético de parsing, compilación JIT e hidratación de componentes cliente de React/Next.js excede los 2500 ms de LCP y 200 ms de TBT.
* **Acción de mitigación e issue asignada:** Se abrió la issue de optimización [[Perf] Optimizar tiempo de hidratación de React y LCP en carga inicial móvil #164](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/issues/164) para introducir dynamic imports (`next/dynamic`), code-splitting de widgets secundarios y diferimiento de scripts no críticos.
* **Techo bloqueante en CI:** El techo de fallo en CI se establece en $\text{LCP} \le 4800\text{ ms}$ y $\text{TBT} \le 750\text{ ms}$ para proteger el pipeline de regresiones severas sin generar falsos positivos mientras se ejecuta la issue #164.
* **Presupuestos estrictos sin excepción:** Accesibilidad ($\ge 0.90$), CLS ($\le 0.10$), scripts JS ($\le 600\text{ KB}$) y tamaño total ($\le 1.8\text{ MB}$) se mantienen estrictamente bloqueantes (`error`).

### 6.2 Procedimiento General para Nuevas Excepciones

Si una funcionalidad crítica de producto requiere incorporar un elemento pesado o una librería que temporalmente vulnere un presupuesto:
1. **No se afloja el assert** en `lighthouserc.cjs` de manera silenciosa.
2. Se documenta la justificación en el PR y se añade una entrada a este documento con:
   * Métrica afectada y valor observado.
   * Causa técnica identificada.
   * Issue de deuda técnica u optimización asignada.
   * Aprobación explícita del líder técnico (`@Ankarmin`).
