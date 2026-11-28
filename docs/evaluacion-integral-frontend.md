# Evaluación Integral del Frontend (H5-F1)

> **Tarea:** H5-F1 de [`odd/tasks/hito-5.md`](../../G3-Chatbot-specs/odd/tasks/hito-5.md).  
> **Issue de seguimiento:** [#145](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/issues/145).  
> **Responsable:** Diego (auditoría inicial, 2026-11-26); Nikol (consolidación 8/8 y seguimiento, 2026-11-27).  
> **Fecha de auditoría:** 2026-11-26; actualizada el 2026-11-27 contra `development` `16b5fee`.  
> **Referencia de evidencia:** Integración en H5-I3 (specs [#61](https://github.com/Taller-SW-Web/G3-Chatbot-specs/issues/61), informe consolidado pendiente de cierre del hito).

---

## 1. Objetivo y Criterios de Evaluación

Esta evaluación cubre los 8 módulos del cliente web en Next.js identificando el estado de implementación y áreas de mejora contra las especificaciones de OpenSpec (`G3-Chatbot-specs/openspec/specs/`). La primera pasada aplicó las mejoras de `mod-catalog` (PR #158). La pasada completa del 2026-11-27 abrió un issue por módulo con sus hallazgos (#182 a #191); la sección 5 resume el estado de cada uno y su evidencia.

Cada flujo fue evaluado en 5 dimensiones fundamentales:
1. **Coherencia con Specs y Backend:** Rutas, payloads, DTOs y manejo de códigos `problem+json`.
2. **Consistencia Visual:** Adherencia al sistema de diseño Inka Athletics (tipografía, tokens de color, botones `wf-btn`, tarjetas `wf-card`).
3. **Responsive y Mobile-First:** Adaptabilidad en viewports desde 360 px hasta 1280 px, sin scroll horizontal espurio y con zonas táctiles mínimas de 44x44 px.
4. **Accesibilidad (a11y):** Roles semánticos WAI-ARIA, navegación por teclado (`Tab`, `Escape`), gestión de foco en modales y contrastes de color WCAG 2.1 AA.
5. **Estados de UI:** Estados de carga (esqueletos con `.shimmer`), estados vacíos informativos con llamada a la acción y estados de error con opción de reintento.

---

## 2. Matriz de Evaluación por Módulo

| Módulo | Flujos y Pantallas Auditadas | Coherencia con Spec / Backend | Diseño & Responsive | Accesibilidad (a11y) | Estados Carga / Vacío / Error | Estado General y Evidencia |
|---|---|:---:|:---:|:---:|:---:|:---:|
| **`mod-catalog`** | `/` (Home), `ProductCard`, `ProductDetailModal`, selector de orden | ✅ Rutas `/catalogo/productos`, `/productos/{id}`, `/disponibilidad` conformes con SPEC-06..09. | ✅ Grid flexible en 2 columnas móvil. | ✅ Enlace accesible `<Link href="/privacidad">` con foco visible implementado. | ✅ Grilla esqueleto accesible con animación `.shimmer` para eliminar CLS. | ✅ **Conforme**<br>(Evidenciado en PR [#158](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/pull/158); suite en `tests/unit/mod_catalog/`) |
| **`mod-chat`** | `/chat/[id]`, `Sidebar`, `MessageBubble`, bloques interactivos | ✅ Streaming SSE (`text/event-stream`), acciones de cliente M5 y bloques interactivos conformes con SPEC-05. | ✅ Burbujas fluidas, scroll automático respetando interacción del usuario. | ✅ Mensajes con roles de lectura y atajos de teclado. | ✅ Skeletons en historial de conversaciones y feedback contextual. | 🟡 **Revisado preliminar**<br>(Pendiente de evidencia formal en PR dedicada) |
| **`mod-cart`** | `/carrito`, `BloqueCarrito`, aplicación y retiro de cupones | ✅ Conforme con SPEC-10 y SPEC-11 (`/carrito`, `/carrito/cupon`). | ✅ Responsive limpio, resumen flotante en mobile y drawer. | ✅ Anuncios `aria-live` en cambios de cantidad y alertas de stock. | ✅ Skeletons con `.shimmer` implementados en `CartPage.tsx`. | 🟡 **Revisado preliminar**<br>(Pendiente de evidencia formal en PR dedicada) |
| **`mod-checkout`** | `/checkout`, `/exito`, `DireccionForm`, `PagoForm` | ✅ Conforme con SPEC-12 y SPEC-14 (`/checkout`, `/checkout/{id}/pago`). | ✅ Stepper visual claro, campos agrupados y tipografía Inka. | ✅ Formularios controlados con `aria-invalid` y mensajes descriptivos. | ✅ Indicador de carga durante procesamiento del pago. | 🟡 **Revisado preliminar**<br>(Pendiente de evidencia formal en PR dedicada) |
| **`mod-orders`** | `/pedidos`, `/pedido`, `/seguimiento` | ✅ `consulta-estado-pedido` con motivo de anulación y reembolso (backend #182, specs #132). | ✅ Pestañas "En proceso", "Finalizados"; desacople canónico de CSAT integrado hacia `mod-postventa` ([PR #153](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/pull/153)). | ✅ Badges de estado con variantes accesibles. | ✅ Skeletons en lista de pedidos y reintento en detalle. | ✅ **Corregido en PR [#192](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/pull/192)** |
| **`mod-postventa`** | `/devolucion`, `/reclamo`, `HistorialPostventa` | ✅ Conforme con SPEC-19..22 (`/devoluciones`, `/reclamos`, `/evidencias`). Dueño canónico de CSAT (`DeliveryRating`). | ✅ Formularios paso a paso con carga de adjuntos y vista previa. | ✅ Atrapamiento de foco en `AttachmentPopup` y `ModalShell`. | ✅ Estado vacío centrado con acción de chat y skeletons en historial. | 🟡 **Revisado preliminar**<br>(Pendiente de evidencia formal en PR dedicada) |
| **`mod-shipping`** | `CotizacionEnvio` dentro de `/checkout` | ✅ La cotización se recotiza al cambiar el carrito (SPEC-12 Req. 5, #185). | ✅ Firma estable del carrito y clave de caché por contenido. | ✅ No recotiza en cada tecla. | ✅ Sin hallazgo propio. | ✅ **Corrección en PR [#195](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/pull/195)** |
| **`mod-auth`** | `/cuenta`, `AuthModal`, `LoginForm`, `RegistroForm`, `MiCuentaPage` | ✅ Conforme con SPEC-01..04 (`/sesion`, `/perfil`, `/registro`, OTP celular opcional). | ✅ Modal responsive centrado en desktop y bottom sheet en mobile. | ✅ Contraseñas con botón de visibilidad `aria-pressed` y checklist de política. | ✅ Spinner de envío y retroalimentación de error por campo. | 🟡 **Revisado preliminar**<br>(Pendiente de evidencia formal en PR dedicada) |

---

## 3. Hallazgos y Mejoras Aplicadas

### Módulo `mod-catalog` (PR #158)
1. **Esqueleto de Carga en Home:**
   * **Antes:** Al cargar ofertas (`catalogo.isPending`), se mostraba únicamente `<p>Cargando productos…</p>`, provocando saltos de maquetación (CLS) cuando la respuesta del backend llegaba.
   * **Mejora:** Se implementó una grilla de 4 tarjetas esqueleto con animación `.shimmer` y `role="status"` con texto oculto accesible `Cargando productos…`, asegurando consistencia visual con `mod-cart` y `mod-orders`.
2. **Navegabilidad y Accesibilidad en Aviso Legal:**
   * **Antes:** El texto *"Conversas con un asistente virtual... Política de privacidad"* usaba un elemento `<span className="underline">` que simulaba ser un enlace sin ser interactivo.
   * **Mejora:** Se reemplazó por un enlace accesible `<Link href="/privacidad">` con foco visible y destino real.
3. **Microcopy y Semántica de Banner:**
   * Se enriqueció el carrusel de banners con `title` y descripción para lectores de pantalla.

---

## 4. Pendientes Justificados (Bloqueos Externos)

* **[Pedidos] Anulación por falta de stock y aviso de reembolso (Issue #143):**
  * **Causa:** el backend expone `motivo` y `reembolso` desde backend [#182](https://github.com/Taller-SW-Web/G3-Chatbot-backend/issues/182); el frontend los muestra en el PR [#192](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/pull/192), en revisión.
* **[Pedidos] Desacople de CSAT a `mod-postventa`:**
  * **Estado:** integrado en `development` vía PR [#153](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/pull/153); `DeliveryRating` reside en `mod-postventa`.
* **[Catálogo] Contador «Mostrando 10 de N», «Ver más» y chips de relajación (#183, hallazgo 1):**
  * **Causa:** el bloque `CARRUSEL_PRODUCTOS` no trae `total` ni la página siguiente y la búsqueda vacía no envía sugerencias. El contrato de specs [#122](https://github.com/Taller-SW-Web/G3-Chatbot-specs/issues/122) ya está cerrado (D8); el bloqueo real es backend [#259](https://github.com/Taller-SW-Web/G3-Chatbot-backend/issues/259).
* **[Pedidos] `ANULADO` en la pestaña «Finalizados» (#187, hallazgo 2):**
  * **Causa:** specs [#121](https://github.com/Taller-SW-Web/G3-Chatbot-specs/issues/121) quedó cerrada con «Finalizados» = `ENTREGADO` + `ANULADO`; el PR [#196](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/pull/196) debe aplicar el nombre y conservar `ANULADO`.

---

## 5. Pasada completa 8/8 (2026-11-27)

Revisión por módulo contra las specs y el backend. Cada hallazgo tiene un issue con su repro y responsable; este informe no duplica los fixes, solo enlaza su estado.

| Módulo | Issue de hallazgos | Prioridad | Responsable | PR | Estado al 2026-11-27 |
|---|---|---|---|---|---|
| `mod-auth` | [#182](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/issues/182) perfil, recuperación y cuenta | P1 | Diego | [#199](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/pull/199) | ✅ Aprobado; merge pendiente |
| `mod-catalog` | [#183](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/issues/183) paginación, banner y `mockData` | P2 | Nikol | [#197](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/pull/197) (draft) | 🟡 Banner y limpieza resueltos; paginación bloqueada por backend #259 |
| `mod-cart` | [#184](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/issues/184) CTA de pago con stock, promociones y vacío | P1 | Diego | [#200](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/pull/200) | ✅ Aprobado; merge pendiente |
| `mod-shipping` | [#185](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/issues/185) recotizar al cambiar el carrito | P2 | Nikol | [#195](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/pull/195) | ✅ Corrección aprobada (cross-módulo; spec aclarada) |
| `mod-checkout` | [#186](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/issues/186) confirmación, expiración y prellenado | P1 | Diego | [#201](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/pull/201) | ✅ Aprobado; merge tras backend #269 |
| `mod-orders` | [#187](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/issues/187) historial y detalle | P2 | Nikol | [#196](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/pull/196) (draft, sobre #192) | 🟡 Aplicar "Finalizados" (specs #121 cerrada) |
| `mod-postventa` | [#188](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/issues/188) formularios e historial | P1 | Diego | [#202](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/pull/202) | ✅ Aprobado; merge pendiente |
| `mod-chat` | [#189](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/issues/189) sugerencias, feedback y cámara | P1 | Nikol | [#193](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/pull/193) | 🟡 En revisión |
| `shared` | [#190](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/issues/190) modales y drawers accesibles | P1 | Nikol | [#194](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/pull/194) | 🟡 En revisión |
| `shared` | [#191](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/issues/191) manifiestos, docs y CSP | P2 | Lume03 | — | ⏳ Abierto |

### Evidencia automatizada

| Verificación | Resultado | Ejecución |
|---|---|---|
| CI de `development` (lint, tipos, unitarias, build, E2E con fakes, SonarCloud, auditoría) | ✅ | [run 46061492036](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/actions/runs/46061492036), commit `16b5fee` |
| Lighthouse CI móvil (rendimiento y accesibilidad, H5-P4) | ✅ | Job `Lighthouse CI` del mismo run; mejoras de carga en PR [#181](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/pull/181) (#164). No audita modales: lo cubre #190 |
| E2E nocturno con LLM real | ✅ | [run 46051984732](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/actions/runs/46051984732) (2026-11-27); cerró el fallo de #157 |
| Mobile-first 390, 820 y 1280 px (`tests/e2e/mobile-first.spec.ts`) | ✅ | Local, 8/8, sobre la rama de #197 |

### Criterio de cierre de H5-F1

H5-F1 se cierra cuando los hallazgos críticos (P1) están corregidos o tienen un issue con responsable, y este informe queda enlazado en `docs/evidencia-hito-5.md` (H5-I3). Al 2026-11-28, los P1 de Diego (#182, #184, #186 y #188) tienen PR #199, #200, #201 y #202; los P1 de chat y modales (#189 y #190) tienen #193 y #194.
