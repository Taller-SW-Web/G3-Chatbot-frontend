# Arquitectura Frontend — Canal Chatbot

> **SPA hexagonal Next.js App Router (solo frontend).** Estado: **fase 0 — 70 ficheros en `src/`, todos en `0 bytes`**, `tests/` solo `.gitkeep`, `package.json` y `tsconfig.json` vacíos. Alineada a `../../PROYECTO CHATBOT/ARQUITECTURA-ICEPANEL.md §7`, `G3-Chatbot-specs/README.md §1.1, §1.4, §2`, `docs/arquitectura/c4.md L2` y `ADR-0002, 0004, 0007, 0008`.
> Regla: si contradice a una spec, manda la spec. Next.js no es BFF: sin Route Handlers/Server Actions; pantallas sesión/chat/carrito en `'use client'`; token en LocalStorage.

## 0. Cómo leer este repo

El frontend también es hexagonal: **la UI no llama a la red directamente**; los casos de uso hablan con puertos y los adapters implementan esos puertos.

Orden de lectura:

1. `src/adapters/inbound/pages/` — las 6 pantallas + `AppShell`. Es lo que ve el usuario.
2. `src/application/use_cases/` + `src/application/state/chatStore.ts` — qué puede hacer el usuario y dónde vive el estado.
3. `src/domain/` — entidades, tipos de bloque y validaciones Zod. Sin React ni `fetch`.
4. `src/ports/outbound/` — los 2 contratos hacia el backend (`ChatbotApiPort`, `WebSocketPort`).
5. `src/adapters/outbound/` + `src/adapters/inbound/hooks/useChat.ts` — cómo se cumple cada contrato (Axios, WS, polling).
6. `src/infrastructure/` — URL base, DI y CSP.

Regla de dependencias: `pages/components → use_cases → ports ← adapters`. `domain/` no importa React, Axios ni `localStorage`. `infrastructure/` cablea.

## 1. Árbol

```
G3-Chatbot-frontend/
├── package.json (0B) / tsconfig.json (0B) / .gitignore / .vscode/settings.json (Live Server 5501)
├── arquitectura-frontend.md (este archivo)
├── docs/ (html/png/json visual-check)
├── src/
│   ├── adapters/inbound/pages/ (7: AppShell + 6 páginas)
│   ├── adapters/inbound/components/ (5 base + blocks/19 + forms/8)
│   ├── adapters/inbound/hooks/ (useChat)
│   ├── adapters/outbound/ (Axios + WebSocket)
│   ├── application/use_cases/ (6) + state/ (chatStore) + providers/ (queryProvider)
│   ├── domain/entities/ (6) + types/ (2) + schemas/ (8) + utils/ (sanitize)
│   ├── infrastructure/config/ (apiConfig) + di/ (container) + security/ (csp)
│   └── ports/outbound/ (ChatbotApiPort, WebSocketPort)
└── tests/ (unit, e2e — solo .gitkeep)
```

## 2. Páginas inbound (6 + AppShell)

| Fichero | Propósito | Origen | Estado |
|---|---|---|---|
| `adapters/inbound/pages/AppShell.tsx` | Layout raíz único, orquesta UI (decisión: `pages/layout.tsx` eliminado para no duplicar) | `README §1.1`, SPEC-05 | Vacío |
| `adapters/inbound/pages/HomePage.tsx` | `/`: banner ofertas, grid `soloOfertas` SPEC-06, campo chat inferior | `README §2`, SPEC-05 Req.2, SPEC-06,08,09 | Vacío |
| `adapters/inbound/pages/ChatPage.tsx` | `/chat/[id]`: historial + tarjetas inline + entrada texto | `README §2`, SPEC-05..09 | Vacío |
| `adapters/inbound/pages/Sidebar.tsx` | Overlay: Nuevo chat, Buscar, Historial recientes, perfil | `README §2`, SPEC-05 Req.1 | Vacío |
| `adapters/inbound/pages/CartPage.tsx` | `/carrito`: líneas, cantidades, subtotal, pago | `README §2`, SPEC-10,11,13 | Vacío |
| `adapters/inbound/pages/CheckoutPage.tsx` | `/checkout`: total, dirección campos libres + documento A14, solo tarjeta | `README §2`, SPEC-12,14 | Vacío |
| `adapters/inbound/pages/OrderHistoryPage.tsx` | `/pedidos` pestañas En proceso/Entregados/Reembolsos | `README §2`, SPEC-17,18,21,22 | Vacío |
| `adapters/inbound/hooks/useChat.ts` | Invoca casos, suscribe store, maneja WS `token/bloque/fin/error` + polling fallback | SPEC-05 Req.4 | Vacío |

Las páginas componen bloques y formularios, invocan casos vía `useChat` y nunca importan Axios ni `fetch` directamente.

## 3. Componentes UI (5 base + 19 bloques + 8 formularios)

| Fichero | Propósito | Origen | Estado |
|---|---|---|---|
| `components/ChatWindow.tsx, MessageBubble.tsx, ProductCard.tsx, CartWidget.tsx, ContactFormWidget.tsx` | Base chat/catálogo/carrito/contacto | `README §1.1`, SPEC-05,09,11 | Vacíos, mantener |
| `components/blocks/TextoPlano.tsx` | `Bloque TEXTO` | `contratos §2.1` | Vacío (creado 19/19) |
| `components/blocks/CarruselProductos.tsx` | `CARRUSEL_PRODUCTOS` max 10 + Ver más | SPEC-06,09 | Vacío |
| `components/blocks/DetalleProducto.tsx` | `DETALLE_PRODUCTO` variantes + SKU | SPEC-09 | Vacío |
| `components/blocks/SelectorVariante.tsx` | `SELECTOR_VARIANTE` / chips atributo faltante | SPEC-09 | Vacío |
| `components/blocks/BloqueCarrito.tsx` | `CARRITO` resumido + Ver carrito/Pagar | SPEC-11 | Vacío (creado) |
| `components/blocks/AccionesRapidas.tsx` | `ACCIONES_RAPIDAS` + pregunta aclaratoria | SPEC-05 Req.5 | Vacío |
| `components/blocks/FormularioGenerico.tsx` | Contenedor `FORMULARIO` 8 subtipos | `contratos §2.1` | Vacío (creado) |
| `components/blocks/ResumenCheckout.tsx` | `RESUMEN_CHECKOUT` + Confirmar y pagar | SPEC-14 | Vacío |
| `components/blocks/ConfirmacionPedido.tsx` | `CONFIRMACION_PEDIDO` + Reenviar correo | SPEC-15,16 | Vacío |
| `components/blocks/ListaPedidos.tsx` | `LISTA_PEDIDOS` elegir entre varios | SPEC-17 | Vacío |
| `components/blocks/EstadoPedido.tsx` | `ESTADO_PEDIDO` + timeline Ventas/Despacho | SPEC-17,18 | Vacío |
| `components/blocks/ListaPromociones.tsx` | `LISTA_PROMOCIONES` canal CHATBOT | SPEC-08 | Vacío |
| `components/blocks/ConstanciaReclamo.tsx, EstadoReclamo.tsx, ListaReclamos.tsx` | `CONSTANCIA/ESTADO_RECLAMO` + duplicados, plazo 15 d hábiles | SPEC-19,20 | Vacíos |
| `components/blocks/ConstanciaDevolucion.tsx, EstadoDevolucion.tsx, ListaDevoluciones.tsx` | `CONSTANCIA/ESTADO_DEVOLUCION` + `resolucion.reembolso`, 7 d naturales | SPEC-21,22 | Vacíos |
| `components/blocks/BloqueError.tsx` | `ERROR` + Reintentar, ramifica por `code` | `contratos §2.8` | Vacío |
| `components/forms/RegistroForm, LoginForm, OtpMfaForm, OtpCelularForm, DireccionForm, PagoForm, ReclamoForm, DevolucionForm.tsx` | 8 formularios seguros RHF+Zod, nunca pasan por LLM | SPEC-01,03,04,12,14,19,21, `ADR-0006` | Vacíos |

Los bloques son "tontos": reciben un `Bloque` ya validado y lo pintan pasando todo texto por `domain/utils/sanitize.ts`. Jamás usan `dangerouslySetInnerHTML` con contenido del LLM o de otros módulos (riesgo XSS R7).

## 4. Núcleo application + dominio

| Fichero | Propósito | Origen | Estado |
|---|---|---|---|
| `application/use_cases/enviarMensajeUseCase.ts` | POST texto/acción → `202 mensajeId`, streaming WS | SPEC-05 Req.4 | Vacío |
| `application/use_cases/cargarHistorialUseCase.ts` | `GET .../mensajes` paginado + `?desde=` polling | SPEC-05 Req.4 | Vacío |
| `application/use_cases/listarConversacionesUseCase.ts` | `GET /chat/conversaciones` orden `ultimo_mensaje_en` | SPEC-05 Req.1 | Vacío |
| `application/use_cases/buscarConversacionesUseCase.ts` | `GET /buscar?q=` título+mensajes | SPEC-05 Req.1 | Vacío |
| `application/use_cases/agregarProductoAlCarritoUseCase.ts` | `{sku,cantidad}` valida stock 409/503 | SPEC-10,11 | Vacío |
| `application/use_cases/validarContactoUseCase.ts` | OTP celular + `CELULAR_NO_VERIFICADO` | SPEC-04 | Vacío |
| `application/state/chatStore.ts` | Zustand observable, `accessToken` LocalStorage 15 min | `README §1.1,1.4`, `ADR-0008` | Vacío |
| `application/providers/queryProvider.tsx` | `QueryClientProvider` listados | `README §1.5` TanStack Query | Vacío |
| `domain/entities/Mensaje.ts, ProductoUI.ts, Cliente.ts, CarritoUI.ts, CheckoutUI.ts, Bloque.ts` | Entidades + unión bloques | `motor-conversacion/design.md` | Vacías |
| `domain/types/EstadoChat.ts` | Máquina `Inicio/Anonimo(chat_sid 7d)/Autenticado/EsperaLogin/Degradado/Limitado 20/min` | `flujos (a)` | Vacía |
| `domain/types/BloqueTipo.ts` | Enum 19 tipos | `contratos §2.1` | Vacía |
| `domain/schemas/registro, login, otpMfa, otpCelular, direccion, pago, reclamo, devolucion.schema.ts` | Validación Zod (documento A14, tarjeta, 5 MB evidencia) | SPEC-01,03,04,12,14,19,21 | Vacías |
| `domain/utils/sanitize.ts` | Sanitiza LLM/módulos, nunca `dangerouslySetInnerHTML` | `README §1.4` R7 XSS | Vacía |

## 5. Outbound + infraestructura

| Fichero | Propósito | Origen | Estado |
|---|---|---|---|
| `adapters/outbound/ChatbotApiAxiosAdapter.ts` + `ports/outbound/ChatbotApiPort.ts` | REST interceptor JWT, ramifica por `code`, `problem+json` | `contratos §1,§2.8` | Vacíos |
| `adapters/outbound/ChatbotWebSocketAdapter.ts` + `ports/outbound/WebSocketPort.ts` | Handshake JWT, reconexión, 2 reintentos luego polling 2 s | SPEC-05 Req.4 | Vacíos |
| `infrastructure/di/container.ts` | DI + wiring adapters | `ADR-0002` | Vacío |
| `infrastructure/config/apiConfig.ts` | URL base backend, timeouts (catálogo 4 s, pago 1 s) | `ADR-0017`, RNFs | Vacío |
| `infrastructure/security/csp.ts` | CSP estricta anti-XSS LocalStorage | `README §1.4` R7 | Vacía |
| `package.json / tsconfig.json` | Deps `next, react, ts, zustand, @tanstack/query, rhf, zod, tailwind, axios, vitest, playwright` | `README §1.5` | Vacíos (scaffold) |
| `tests/unit, e2e` | Vitest+Testing Library, Playwright; 1 test por escenario | `README §5` | Solo `.gitkeep` |

## 6. Flujo A — enviar mensaje y renderizar bloque (trazado)

Caso: visitante en `ChatPage` escribe "busco zapatillas running talla 42".

1. `ChatPage.tsx` + `useChat.ts` invocan `application/use_cases/enviarMensajeUseCase.ts` con `{texto}`. El caso no toca Axios: llama a `ports/outbound/ChatbotApiPort.ts`.
2. `adapters/outbound/ChatbotApiAxiosAdapter.ts` hace `POST /chat/conversaciones/{id}/mensajes`, adjunta `Authorization: Bearer` desde `chatStore.ts` y devuelve `202 {mensajeId}`.
3. El backend responde por WS: `adapters/outbound/ChatbotWebSocketAdapter.ts` recibe `token*` y los agrega al store (efecto "escribiendo en vivo"). Luego llega `bloque CARRUSEL_PRODUCTOS`.
4. `ChatPage` mapea `Bloque.tipo` (`domain/types/BloqueTipo.ts` + `entities/Bloque.ts`) a `components/blocks/CarruselProductos.tsx`, pasando cada texto por `domain/utils/sanitize.ts`.
5. Llega `fin` → el caso marca el turno completo. Si llega `error`, se pinta `blocks/BloqueError.tsx` ramificando por `code` (`REQUIERE_SESION` abre login guardando `accionPendiente`, `STOCK_INSUFICIENTE` muestra disponible, etc.).
6. Si el WS no conecta tras 2 reintentos, `cargarHistorialUseCase.ts` hace polling a `GET .../mensajes?desde={mensajeId}` cada 2 s. La UI no distingue el origen.

## 7. Flujo B — checkout en `CheckoutPage` (trazado)

1. El chat detecta `CELULAR_NO_VERIFICADO` y abre `forms/OtpCelularForm.tsx` (validado por `schemas/otpCelular.schema.ts`, 6 dígitos). `validarContactoUseCase.ts` lo verifica.
2. Se navega a `CheckoutPage.tsx` con la sección de dirección enfocada: `forms/DireccionForm.tsx` (`schemas/direccion.schema.ts` con documento A14 DNI/RUC/CE/PASAPORTE) + `forms/PagoForm.tsx` (`schemas/pago.schema.ts`, solo tarjeta, sin guardar PAN).
3. Los casos piden cotización y crean checkout vía `ChatbotApiPort`; `ResumenCheckout.tsx` muestra el total. Si el total cambia (409 `CARRITO_DESACTUALIZADO`), se muestra el diff y se re-confirma.
4. Tras pagar, `ConfirmacionPedido.tsx` + botón Reenviar (SPEC-16, max 2).

## 8. Reglas por capa (qué sí / qué no)

| Capa | Sí | No |
|---|---|---|
| `pages/components` | Componer bloques/forms, invocar casos vía `useChat` | Importar Axios/`fetch`/`localStorage` directo |
| `use_cases` | Orquestar puertos + store | Importar `.tsx`, Axios o WS directo |
| `domain` | Tipos, entidades, schemas Zod, `sanitize` | React, `fetch`, `localStorage`, `window` |
| `adapters/outbound` | Único lugar con red (interceptor JWT, reconnect, polling) | Reglas de negocio |
| `infrastructure` | URL base, DI, CSP | Llamadas a negocio |

## 9. Ejemplo: dar de alta página + bloque + form+schema

Supón `VerificarCorreoPage` (SPEC-02, hoy falta):

1. Crea el contrato que necesita en `domain/entities/` + `types/` si hay bloque nuevo (o reutiliza `BloqueTipo`).
2. Crea la validación en `domain/schemas/` (p. ej. token de enlace) sin React.
3. Crea el caso en `application/use_cases/` que usa `ChatbotApiPort` (nunca Axios).
4. Crea la página en `adapters/inbound/pages/VerificarCorreoPage.tsx` que invoca el caso vía hook y pinta bloques existentes.
5. Si necesita formulario, crea `components/forms/XForm.tsx` + su `schemas/x.schema.ts` con RHF+`zodResolver`, pasando todo texto por `sanitize.ts`.
6. Registra la ruta, cablea en `infrastructure/di/container.ts` y añade test en `tests/unit` + `e2e`.
7. Actualiza este `.md` y `ARQUITECTURA-ICEPANEL.md` si aparece un bloque o página nuevos.

Checklist: ¿la página importa Axios? Debe responder no. ¿el schema importa React? Debe responder no. ¿el error se ramifica por `code` y no por texto? Debe responder sí.

## 10. Mapeo C4

| Nivel | Carpetas |
|---|---|
| L2 App `Frontend web` | Todo `src/` + `package/tsconfig` |
| L3 inbound | `pages/, components/, hooks/` |
| L3 application/domain | `use_cases/, state/, providers/, entities/, types/, schemas/, utils/` |
| L3 outbound/infra | `adapters/outbound/, ports/, infrastructure/` |
| L4 | Link a cada ruta `src/...` de este archivo |

## 11. Glosario + errores comunes

`AppShell`: layout único (se eliminó `layout.tsx` duplicado). `Bloque`: unidad visual que manda el backend (`BloqueTipo` 19 valores). `chatStore`: estado observable con token de 15 min; el refresh vive en cookie `httpOnly` del backend. `code`: campo de `problem+json` por el que ramifica la UI. CSP/sanitize: mitigaciones del riesgo XSS por guardar el token en LocalStorage (R7). Errores típicos: llamar Axios desde la página, guardar el token fuera del store, usar `dangerouslySetInnerHTML` con texto del LLM, validar tarjeta solo en UI sin schema, olvidar el fallback a polling cuando el WS falla.

## 12. Trazabilidad y gaps

SPEC-01..04 → `Registro/Login/OtpMfa/OtpCelular forms+schemas, useChat, chatStore, Axios interceptor, VerificarCorreo` (falta `VerificarCorreoPage` — crear en fase 1). 

SPEC-05 → `AppShell, Sidebar, Home, ChatPage, MessageList sustituido por ChatWindow+MessageBubble, Composer pendiente, QuickReplies pendiente, TypingIndicator/DegradedBanner pendientes, WS+polling`. 

SPEC-06..09 → `Carrusel, Detalle, Selector, ListaPromos, AppliedFiltersBar/LoadMore/EmptyResults pendientes`. 

SPEC-10,11,13 → `CartPage, BloqueCarrito, CouponInput pendiente, StockConflict/AvailabilityBadge pendientes`. 

SPEC-12,14 → `CheckoutPage, Direccion/Pago forms+schemas, ResumenCheckout`. 

SPEC-15,16 → `ConfirmacionPedido, PendingConfirmation pendiente`. 

SPEC-17,18 → `OrderHistoryPage, Lista/EstadoPedido, ShipmentTracking/Milestones pendientes`. 

SPEC-19..22 → `Reclamo/Devolucion forms+schemas, Constancia/Estado/Lista, ReturnHistoryTab en History`.

Gaps fase 1: rellenar `package.json` real + `main.tsx/App.tsx`/router, `QueryClient`, `RHF+zodResolver`, `DOMPurify`, `CSP headers`, `VerificarCorreoPage`, componentes pendientes listados, 1 test por escenario.
