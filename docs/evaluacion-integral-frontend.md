# Evaluación Integral del Frontend (H5-F1)

> **Tarea:** H5-F1 de [`odd/tasks/hito-5.md`](../../G3-Chatbot-specs/odd/tasks/hito-5.md).  
> **Issue de seguimiento:** [#145](https://github.com/Taller-SW-Web/G3-Chatbot-frontend/issues/145).  
> **Responsable:** Diego.  
> **Fecha de auditoría:** 2026-11-26.  
> **Referencia de evidencia:** Enlazado en H5-I3 (`docs/evidencia-hito-5.md`).

---

## 1. Objetivo y Criterios de Evaluación

Esta evaluación cubre los 7 módulos del cliente web en Next.js contra las especificaciones de OpenSpec (`G3-Chatbot-specs/openspec/specs/`) y las respuestas reales del backend en producción y entornos de prueba.

Cada flujo fue evaluado en 5 dimensiones fundamentales:
1. **Coherencia con Specs y Backend:** Rutas, payloads, DTOs y manejo de códigos `problem+json`.
2. **Consistencia Visual:** Adherencia al sistema de diseño Inka Athletics (tipografía, tokens de color, botones `wf-btn`, tarjetas `wf-card`).
3. **Responsive y Mobile-First:** Adaptabilidad en viewports desde 360 px hasta 1280 px, sin scroll horizontal espurio y con zonas táctiles mínimas de 44x44 px.
4. **Accesibilidad (a11y):** Roles semánticos WAI-ARIA, navegación por teclado (`Tab`, `Escape`), gestión de foco en modales y contrastes de color WCAG 2.1 AA.
5. **Estados de UI:** Estados de carga (esqueletos con `.shimmer`), estados vacíos informativos con llamada a la acción y estados de error con opción de reintento.

---

## 2. Matriz de Evaluación por Módulo

| Módulo | Flujos y Pantallas Auditadas | Coherencia con Spec / Backend | Diseño & Responsive | Accesibilidad (a11y) | Estados Carga / Vacío / Error | Estado General |
|---|---|:---:|:---:|:---:|:---:|:---:|
| **`mod-catalog`** | `/` (Home), `ProductCard`, `ProductDetailModal`, selector de orden | ✅ Rutas `/catalogo/productos`, `/productos/{id}`, `/disponibilidad` conformes con SPEC-06..09. | ✅ Grid flexible en 2 columnas móvil. | ⚠️ El aviso legal tenía un `<span>` en lugar de un `<Link>` accesible hacia `/privacidad`. | ⚠️ La carga en Home mostraba solo texto simple; se mejora a esqueleto con shimmer. | **Mejoras aplicadas en PR #157** |
| **`mod-chat`** | `/chat/[id]`, `Sidebar`, `MessageBubble`, bloques interactivos | ✅ Streaming SSE (`text/event-stream`), acciones de cliente M5 y bloques interactivos conformes con SPEC-05. | ✅ Burbujas fluidas, scroll automático respetando interacción del usuario. | ✅ Mensajes con roles de lectura y atajos de teclado. | ✅ Skeletons en historial de conversaciones y feedback contextual. | ✅ **Conforme** |
| **`mod-cart`** | `/carrito`, `BloqueCarrito`, aplicación y retiro de cupones | ✅ Conforme con SPEC-10 y SPEC-11 (`/carrito`, `/carrito/cupon`). | ✅ Responsive limpio, resumen flotante en mobile y drawer. | ✅ Anuncios `aria-live` en cambios de cantidad y alertas de stock. | ✅ Skeletons con `.shimmer` implementados en `CartPage.tsx`. | ✅ **Conforme** |
| **`mod-checkout`** | `/checkout`, `/exito`, `DireccionForm`, `PagoForm` | ✅ Conforme con SPEC-12 y SPEC-14 (`/checkout`, `/checkout/{id}/pago`). | ✅ Stepper visual claro, campos agrupados y tipografía Inka. | ✅ Formularios controlados con `aria-invalid` y mensajes descriptivos. | ✅ Indicador de carga durante procesamiento del pago. | ✅ **Conforme** |
| **`mod-orders`** | `/pedidos`, `/pedido`, `/seguimiento` | 🟡 `consulta-estado-pedido` en 🟡 por falta de motivo de anulación y reembolso en backend. | ✅ Pestañas "En proceso", "Entregados" y detalles con CSAT slot. | ✅ Badges de estado con variantes accesibles. | ✅ Skeletons en lista de pedidos y reintento en detalle. | 🟡 **Pendiente de Backend #182** |
| **`mod-postventa`** | `/devolucion`, `/reclamo`, `HistorialPostventa` | ✅ Conforme con SPEC-19..22 (`/devoluciones`, `/reclamos`, `/evidencias`). | ✅ Formularios paso a paso con carga de adjuntos y vista previa. | ✅ Atrapamiento de foco en `AttachmentPopup` y `ModalShell`. | ✅ Estado vacío centrado con acción de chat y skeletons en historial. | ✅ **Conforme** |
| **`mod-auth`** | `/cuenta`, `AuthModal`, `LoginForm`, `RegistroForm`, `MiCuentaPage` | ✅ Conforme con SPEC-01..04 (`/sesion`, `/perfil`, `/registro`, OTP celular opcional). | ✅ Modal responsive centrado en desktop y bottom sheet en mobile. | ✅ Contraseñas con botón de visibilidad `aria-pressed` y checklist de política. | ✅ Spinner de envío y retroalimentación de error por campo. | ✅ **Conforme** |

---

## 3. Hallazgos y Mejoras Aplicadas

### Módulo `mod-catalog` (PR dedicado)
1. **Esqueleto de Carga en Home:**
   * **Antes:** Al cargar ofertas (`catalogo.isPending`), se mostraba únicamente `<p>Cargando productos…</p>`, provocando saltos de maquetación (CLS) cuando la respuesta del backend llegaba.
   * **Mejora:** Se implementó una grilla de 4 tarjetas esqueleto con animación `.shimmer` y `role="status"` con texto oculto accesible `Cargando productos en oferta…`, asegurando consistencia visual con `mod-cart` y `mod-orders`.
2. **Navegabilidad y Accesibilidad en Aviso Legal:**
   * **Antes:** El texto *"Conversas con un asistente virtual... Política de privacidad"* usaba un elemento `<span className="underline">` que simulaba ser un enlace sin ser interactivo.
   * **Mejora:** Se reemplazó por un enlace accesible `<Link href="/privacidad">` con foco visible y destino real.
3. **Microcopy y Semántica de Banner:**
   * Se enriqueció el carrusel de banners con `title` y descripción para lectores de pantalla.

---

## 4. Pendientes Justificados (Bloqueos Externos)

* **[Pedidos] Anulación por falta de stock y aviso de reembolso (Issue #143):**
  * **Causa:** El backend aún no expone `motivo` ni `reembolso` en el DTO `OrderDetailResponse` (Issue del backend [#182](https://github.com/Taller-SW-Web/G3-Chatbot-backend/issues/182) a cargo de Mathias).
  * **Acción:** Queda registrado en la auditoría general de specs (`docs/auditoria-specs-2026-11.md`) como pendiente justificado hasta que el backend integre el PR correspondiente.
