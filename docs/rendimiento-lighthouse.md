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
| **Largest Contentful Paint (LCP)** | $\le 2500\text{ ms}$ | $\le 4800\text{ ms}$ | `error` (Bloqueante) | Rango **Good** de Google Core Web Vitals en condiciones móviles 4G. En CI virtualizado (CPU 4x), la peor mediana observada es 4522 ms (en `/pedidos`); se fija techo protector de 4800 ms mientras se optimiza en [#164](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/issues/164). |
| **Cumulative Layout Shift (CLS)** | $\le 0.10$ | $\le 0.10$ | `error` (Bloqueante) | Rango **Good** de Google Core Web Vitals (estabilidad visual sin saltos). |
| **Total Blocking Time (TBT)** | $\le 200\text{ ms}$ | $\le 350\text{ ms}$ | `error` (Bloqueante) | **Proxy de INP:** En entornos de laboratorio sintéticos (CI sin interacción humana directa), Lighthouse no puede calcular el Interaction to Next Paint (INP) de campo. Por ello, se utiliza el Total Blocking Time (TBT) como proxy directo de congestión del hilo principal. El objetivo es $\le 200\text{ ms}$, con techo protector acotado a 350 ms en CI (peor mediana observada en CI: 291 ms, Issue [#164](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/issues/164)). |
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

## 4. Línea Base Medida en CI (Preset Móvil - Mediana Real)

Mediciones de referencia extraídas directamente de los artefactos oficiales de CI (Run 45933045893, 3 corridas con mediana por URL en runner Ubuntu con emulación móvil Moto G4):

| URL Auditada | Rendimiento | Accesibilidad | LCP (Mediana) | CLS (Mediana) | TBT (Mediana) | Peso Scripts | Peso Total | Estado |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **`/` (Home)** | 80% | 96% | $4172\text{ ms}$ | $0.000$ | $291\text{ ms}$ | $371\text{ KB}$ | $505\text{ KB}$ | ✅ Conforme |
| **`/carrito` (Carrito)** | 95% | 100% | $765\text{ ms}$ | $0.000$ | $263\text{ ms}$ | $371\text{ KB}$ | $505\text{ KB}$ | ✅ Conforme |
| **`/pedidos` (Historial)** | 79% | 92% | $4522\text{ ms}$ | $0.000$ | $273\text{ ms}$ | $371\text{ KB}$ | $505\text{ KB}$ | ✅ Conforme |
| **`/cuenta` (Mi Cuenta)** | 83% | 92% | $4085\text{ ms}$ | $0.000$ | $225\text{ ms}$ | $371\text{ KB}$ | $505\text{ KB}$ | ✅ Conforme |
| **Peor Mediana Global** | **79%** | **92%** | **$4522\text{ ms}$** | **$0.000$** | **$291\text{ ms}$** | **$371\text{ KB}$** | **$505\text{ KB}$** | ✅ Conforme |

### 4.1 Limitaciones y Condiciones de la Medición

1. **Aislamiento de Backend (`API_PROXY_TARGET` no definido):**
   * En el job `lighthouse` de CI, Next.js se compila y ejecuta de forma aislada sin levantar réplica de backend ni base de datos.
   * Por consiguiente, las páginas con llamadas a la API (`/`, `/pedidos`, `/cuenta`) auditan el comportamiento ante fallos de conexión o respuestas no disponibles, impactando los ciclos de renderizado del cliente (mientras que `/carrito` muestra renderizado inmediato con LCP de 765 ms).
2. **Emulación de Dispositivo Móvil en Entornos Virtualizados:**
   * Lighthouse aplica simulación de dispositivo móvil (desaceleración de CPU 4x y red móvil 4G simulada).
   * En máquinas virtuales compartidas de CI (2 vCPUs de Azure en GitHub Actions), la penalización sintética de CPU 4x incrementa el tiempo de parsing y evaluación de bundles JavaScript.

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

## 6. Excepciones Técnicas y Procedimiento

### 6.1 Excepción Técnica en CI (Mobile Emulation) - En revisión con @Ankarmin

* **Métrica afectada:** LCP y TBT en preset mobile en runners de CI.
* **Valores reales medidos en CI:** Peor mediana de LCP $= 4522\text{ ms}$ (en `/pedidos`); peor mediana de TBT $= 291\text{ ms}$ (en `/`).
* **Causa técnica identificada:** Emulación móvil de Lighthouse (desaceleración de CPU 4x) en runners de 2 vCPUs sin backend activo, retrasando la hidratación cliente de React en páginas dinámicas.
* **Presupuesto objetivo formal:** $\text{LCP} \le 2500\text{ ms}$ y $\text{TBT} \le 200\text{ ms}$ (se mantienen inalterados como meta del proyecto).
* **Techo protector bloqueante en CI propuesto:** Se propone fijar en CI $\text{LCP} \le 4800\text{ ms}$ y $\text{TBT} \le 350\text{ ms}$ (acotado estrechamente sobre la peor mediana de 291 ms) para evitar falsos positivos en CI mientras se atiende la issue de optimización [#164](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/issues/164).
* **Estado de aprobación:** Sometido a la aprobación explícita del líder técnico (`@Ankarmin`) en la revisión del PR #156 conforme al procedimiento de §6.2.
* **Presupuestos estrictos sin excepción:** Accesibilidad ($\ge 0.90$), CLS ($\le 0.10$), scripts JS ($\le 600\text{ KB}$) y tamaño total ($\le 1.8\text{ MB}$) operan en nivel `error` estricto y bloqueante.

### 6.2 Procedimiento General para Nuevas Excepciones

Si una funcionalidad crítica de producto requiere incorporar un elemento pesado o una librería que temporalmente vulnere un presupuesto:
1. **No se afloja el assert** en `lighthouserc.cjs` de manera silenciosa.
2. Se documenta la justificación en el PR y se añade una entrada a este documento con:
   * Métrica afectada y valor observado.
   * Causa técnica identificada.
   * Issue de deuda técnica u optimización asignada.
   * Aprobación explícita del líder técnico (`@Ankarmin`).
