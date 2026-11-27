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

| Métrica / Categoría | Umbral | Nivel en CI | Criterio y Justificación Técnica |
|---|---|:---:|---|
| **Largest Contentful Paint (LCP)** | $\le 2500\text{ ms}$ | `error` (Bloqueante) | Rango **Good** de Google Core Web Vitals en condiciones móviles 4G. |
| **Cumulative Layout Shift (CLS)** | $\le 0.10$ | `error` (Bloqueante) | Rango **Good** de Google Core Web Vitals (estabilidad visual sin saltos). |
| **Total Blocking Time (TBT)** | $\le 200\text{ ms}$ | `error` (Bloqueante) | **Proxy de INP:** En entornos de laboratorio sintéticos (CI sin interacción humana directa), Lighthouse no puede calcular el Interaction to Next Paint (INP) de campo. Por ello, se utiliza el Total Blocking Time (TBT) como proxy directo de la capacidad de respuesta y congestión del hilo principal, fijando el umbral estricto en $\le 200\text{ ms}$ (rango Good). |
| **Tamaño de Scripts JS** | $\le 600\text{ KB}$ | `error` (Bloqueante) | Presupuesto de peso estricto para evitar sobrecargar la descarga e hidratación de JavaScript. |
| **Tamaño Total de Recursos** | $\le 1.8\text{ MB}$ | `error` (Bloqueante) | Techo máximo de transferencia acumulada (imágenes optimizadas, fuentes, CSS y bundles). |
| **Accesibilidad (a11y)** | Score $\ge 0.90$ | `error` (Bloqueante) | **Proxy de accesibilidad:** La puntuación de Lighthouse evalúa reglas automatizadas de contraste, atributos ARIA, nombres accesibles y roles semánticos. Funciona como gate preventivo automático, pero no sustituye una auditoría funcional y manual completa de WCAG 2.1 AA. |
| **Rendimiento General** | Score $\ge 0.70$ | `warn` (Alerta) | Umbral de advertencia sobre la puntuación agregada del motor Lighthouse. |
| **Mejores Prácticas** | Score $\ge 0.80$ | `warn` (Alerta) | Prácticas web modernas (HTTPS, doctype, librerías sin vulnerabilidades). |
| **SEO** | Score $\ge 0.80$ | `warn` (Alerta) | Meta-etiquetas, viewports y rastreabilidad de páginas estáticas. |

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

## 6. Procedimiento para Excepciones Justificadas

Si una funcionalidad crítica de producto requiere incorporar un elemento pesado o una librería que temporalmente vulnere un presupuesto:
1. **No se afloja el assert** en `lighthouserc.cjs` de manera silenciosa.
2. Se documenta la justificación en el PR y se añade una entrada a este documento con:
   * Métrica afectada y valor observado.
   * Causa técnica identificada.
   * Issue de deuda técnica u optimización asignada.
   * Aprobación explícita del líder técnico (`@Ankarmin`).
