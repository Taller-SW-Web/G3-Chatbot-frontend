# Rendimiento y Accesibilidad en Frontend: Lighthouse CI (H5-P4)

> **Tarea:** H5-P4 de [`odd/tasks/hito-5.md`](../../G3-Chatbot-specs/odd/tasks/hito-5.md).  
> **Referencia:** [`docs/slo-performance.md`](../../G3-Chatbot-specs/docs/slo-performance.md).  
> **Responsable:** Diego.  
> **Workflow:** `.github/workflows/lighthouse.yml`.  
> **Configuración:** `lighthouserc.cjs`.

---

## 1. Propósito y Alcance

Este documento fija la línea base y los presupuestos de rendimiento, accesibilidad y Core Web Vitals para las principales páginas del canal conversacional en Next.js. El objetivo es prevenir regresiones en cada Pull Request mediante una auditoría automatizada en GitHub Actions.

---

## 2. Presupuestos de Rendimiento y Accesibilidad

Los presupuestos están configurados en [`lighthouserc.cjs`](../lighthouserc.cjs) y se evalúan de forma automática con `@lhci/cli`:

| Categoría / Métrica | Presupuesto (Umbral) | Nivel de Bloqueo | Justificación / Estándar |
|---|---|:---:|---|
| **Accesibilidad (a11y)** | Score $\ge 0.90$ (90%) | `error` (Bloqueante) | Cumplimiento WCAG 2.1 AA en formularios, botones y contrastes. |
| **Largest Contentful Paint (LCP)** | $\le 3000\text{ ms}$ | `error` (Bloqueante) | Core Web Vital: contenido principal visible en menos de 3 s. |
| **Cumulative Layout Shift (CLS)** | $\le 0.10$ | `error` (Bloqueante) | Core Web Vital: estabilidad visual sin saltos molestos. |
| **Total Blocking Time (TBT)** | $\le 500\text{ ms}$ | `error` (Bloqueante) | Proxy de interactividad (INP) durante la carga inicial. |
| **Rendimiento General** | Score $\ge 0.70$ (70%) | `warn` (Alerta) | Techo mínimo en modo desarrollo/preview. |
| **Max Potential FID** | $\le 250\text{ ms}$ | `warn` (Alerta) | Retardo de primera interacción. |
| **Time to Interactive (TTI)** | $\le 3800\text{ ms}$ | `warn` (Alerta) | Página completamente interactiva. |
| **Peso total de Scripts JS** | $\le 600\text{ KB}$ | `warn` (Alerta) | Control del tamaño de bundles generados por Next.js. |
| **Peso total de Recursos** | $\le 1.8\text{ MB}$ | `warn` (Alerta) | Techo de carga inicial en redes móviles. |

---

## 3. URLs Auditadas

Se auditan las 4 rutas clave que representan los flujos principales del usuario:

1. **Catálogo / Home (`/`):** Vista de productos, ofertas y punto de entrada al chat.
2. **Carrito (`/carrito`):** Resumen de compra, líneas de producto y cálculo de totales.
3. **Historial de Pedidos (`/pedidos`):** Pestañas de seguimiento de pedidos en proceso y entregados.
4. **Mi Cuenta (`/cuenta`):** Datos del cliente, sesión y formulario de autenticación.

---

## 4. Ejecución

### Local
Para correr Lighthouse CI en local (requiere `pnpm run build` previo):
```bash
pnpm run build
pnpm run lhci
```
Los reportes HTML y JSON se guardan en `.lighthouseci/`.

### En CI (GitHub Actions)
* Se ejecuta automáticamente en cada **Pull Request** hacia `development`.
* Publica un resumen tabular en el **Step Summary** del workflow.
* Sube los reportes completos como artefacto descargable (`lighthouse-reports`) con retención de 7 días.
* Si alguna aserción marcada con `error` se incumple, el job falla y bloquea el merge.

---

## 5. Política de Excepciones

Si un cambio justificado (por ejemplo, incorporación de un visualizador complejo o integración de terceros) incumple temporalmente algún presupuesto:
1. No se elimina el assert en `lighthouserc.cjs`.
2. Se documenta la excepción en el PR y en este archivo bajo la sección «Excepciones Aprobadas», indicando el motivo, el score transitorio y el issue de optimización planificado.
